

const Category = require('../../models/categoryModel')
const Products = require('../../models/productModel')

module.exports = {

 //------ProductManagement--------------> 
 async loadProductManagement(req, res) {
    try {
        if (!req.session.admin) {
            return res.status(200).render('admin/login', { message: "" });
        }
        
       
        const page = parseInt(req.query.page) || 1;
        const productsPerPage = 10;
        const skip = (page - 1) * productsPerPage;

        
        const products = await Products.find({ isDeleted: false })
            .skip(skip)
            .limit(productsPerPage)
            .populate('category');

        
        const totalProducts = await Products.countDocuments({ isDeleted: false });
        const totalPages = Math.ceil(totalProducts / productsPerPage);

        if (!products || products.length === 0) {
            return res.status(200).render('admin/productManagement', { msg: 'No products found', products: [], currentPage: page, totalPages });
        }

        
        return res.status(200).render('admin/productManagement', { products, currentPage: page, totalPages });
    } catch (error) {
        console.log('Error loading product management ➡️' + error);
        res.status(500).json({ message: 'Error loading product management' });
    }
},




//------addProduct--------------------->
async loadAddProductsPage(req, res) {
    try {
        if (!req.session.admin) {
            return res.status(200).render('admin/login', { message: "" });
        }

        // Fetch categories for the dropdown
        const categories = await Category.find({ isDeleted: false });
        
        // Render the product add page with categories
        return res.status(200).render('admin/productAdd', { 
            categories,
            message: ''
        });
    } catch (error) {
        console.error('Error loading add products page ➡️', error);
        return res.status(500).render('error/erroralert', { 
            message: 'Error loading add product page'
        });
    }
},




async postAddProductsPage(req, res) {
    try {
        const {
            productName,
            productDescription,
            productPrice,
            productOfferPrice,
            productStockManagement, 
            productTags,
            productBrand,
            productCashOnDelivery,
            productWarranty,
            productReturnPolicy,
            productCategory,
        } = req.body;

        

        // Validate required fields
        if (!productName || !productDescription || !productPrice || !productCategory) {
            return res.status(400).json({
                success: false,
                message: 'Please fill in all required fields.',
            });
        }

        // Ensure files are uploaded
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files were uploaded.',
            });
        }

        const imagePaths = Object.values(req.files)
            .flat()
            .map(file => file.path.split('public')[1]);

     
        let stockManagement = {};
        
        
        if (productStockManagement) {
            try {
                stockManagement = JSON.parse(productStockManagement);
                
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid stock management format.',
                });
            }
        }

        const parsedSizes = stockManagement || [];
        // Create product object
        const newProduct = new Products({
            name: productName,
            description: productDescription,
            price: parseFloat(productPrice),
            offerPrice: productOfferPrice
                ? parseFloat(productOfferPrice)
                : parseFloat(productPrice),
            stockManagement: parsedSizes,
            images: imagePaths,
            tags: productTags ? productTags.split(',') : [],
            brand: productBrand || null,
            cashOnDelivery: productCashOnDelivery === 'Yes',
            warranty: productWarranty || null,
            returnPolicy: productReturnPolicy || null,
            category: productCategory,
            isDeleted: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        
        // Save product to the database
        await newProduct.save();

        // Redirect or respond with success
        return res.redirect('/admin/productManagement');
    } catch (error) {
        // console.error(':', error);
        res.status(500).json({
            success: false,
            message: 'Error posting product. Please try again later.',
        });
    }
},
//------updateProduct--------------------->

async loadUpdateProduct(req, res) {
    try {
        if (!req.session.admin) {
            return res.status(200).render('admin/login', { message: "" });
        }

        const productId = req.params.id;
        if (!productId) {
            return res.status(400).render('error/erroralert', { 
                message: 'Product ID is required' 
            });
        }

        const [product, categories] = await Promise.all([
            Products.findById(productId).populate('category'),
            Category.find({ isDeleted: false })
        ]);

        if (!product) {
            return res.status(404).render('error/erroralert', { 
                message: 'Product not found' 
            });
        }

        return res.status(200).render('admin/productUpdate', {
            product,
            categories,
            message: ''
        });

    } catch (error) {
        console.error('Error loading update product page ➡️', error);
        return res.status(500).render('error/erroralert', { 
            message: 'Error loading update product page' 
        });
    }
},

async postUpdateProduct(req, res) {
    try {
        const productId = req.params.id;
        console.log(productId);
        
        const existingProduct = await Products.findById(productId);
        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

      

        

        // Parse stock management data
        let parsedStockManagement = [];
        try {
            const stockData = JSON.parse(req.body.productStockManagement || '[]');
            parsedStockManagement = stockData.map(item => ({
                size: item.size,
                quantity: parseInt(item.quantity) || 0
            }));
        } catch (error) {
            console.error('Stock parsing error:', error);
            parsedStockManagement = existingProduct.stockManagement;
        }

       
        const updatedProduct = await Products.findByIdAndUpdate(
            productId,
            {
                $set: {
                    name: req.body.productName,
                    description: req.body.productDescription,
                    price: parseFloat(req.body.productPrice),
                    offerPrice: req.body.offerPrice ? 
                              parseInt(req.body.offerPrice) : 
                              parseInt(req.body.productPrice),
                    stockManagement: parsedStockManagement,
                   
                    tags: req.body.productTags ? req.body.productTags.split(',') : [],
                    brand: req.body.productBrand,
                    warranty: req.body.productWarranty,
                    returnPolicy: req.body.productReturnPolicy,
                    category: req.body.productCategory,
                    updatedAt: Date.now()
                }
            },
            { new: true, runValidators: true }
        );

        console.log("the product updatedProduct:----> " + updatedProduct);
        

        return res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            product: updatedProduct
        });

    } catch (error) {
        console.error('Error updating product:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Error updating product'
        });
    }
},
//---------delete product----------------->
async loadDelProductPage (req, res){
    try {
        const deletedProducts = await Products.find({ isDeleted: true });
        res.render("admin/productDelete", { deletedProducts });
    } catch (error) {
        console.error("Error fetching deleted products:", error);
        res.status(500).send("Internal Server Error");
    }
},

async deleteProduct (req, res){
    try {
        const { productId } = req.body;

        const product = await Products.findByIdAndUpdate(
            productId,
            { isDeleted: true }, // Mark as deleted (soft delete)
            { new: true } // Return the updated product
        );

        if (!product) {
            return res.status(404).send('Product not found');
        }

        res.status(200).json({ success: true }) // Redirect back to the product list after deleting
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false });

    }
},

async recoverProducts(req, res){
    const { id } = req.params;
    // console.log(id);

    try {
        await Products.findByIdAndUpdate(id, { isDeleted: false });
        return res.json({ success: true });
    } catch (error) {
        console.error("Error recovering product:", error);
        res.status(500).send("Internal Server Error");
    }
},


async permanentDeleteProducts(req, res){
    const { id } = req.params;
    console.log(id);

    try {
        await Products.findByIdAndDelete(id);
        return res.json({ success: true });
    } catch (error) {
        console.error("Error permanently deleting product:", error);
        res.status(500).send("Internal Server Error");
    }
},

};