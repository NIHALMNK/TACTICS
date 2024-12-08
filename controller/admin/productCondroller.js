

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
async loadAddProductsPage (req, res){
    try {
        const categories = await Category.find({ isDeleted: false });
        res.render('admin/productAdd', { categories: categories ,});
    } catch (error) {
        console.error('Error loading product adding page:', error);
        res.status(500).json({ message: 'Error loading product adding page' });
    }
},




async postAddProductsPage(req, res) {
    try {
        const {
            productName,
            productDescription,
            productPrice,
            productOfferPrice,
            productStock,
            productTags,
            productSizes,
            productColors,
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

        // Process images
        const imagePaths = Object.values(req.files)
            .flat()
            .map(file => file.path.split('public')[1]); // Extract relative paths

        // Create product object
        const newProduct = new Products({
            name: productName,
            description: productDescription,
            price: parseFloat(productPrice), // Ensure price is a valid number
            offerPrice: productOfferPrice
                ? parseFloat(productOfferPrice)
                : parseFloat(productPrice), // Default offerPrice to productPrice if not provided
            images: imagePaths,
            stock: productStock ? parseInt(productStock, 10) : 0, // Default stock to 0 if not provided
            tags: productTags ? productTags.split(',') : [], // Convert tags to an array
            sizes: productSizes ? productSizes.split(',') : [], // Convert sizes to an array
            colors: productColors ? productColors.split(',') : [], // Convert colors to an array
            brand: productBrand || null, // Allow brand to be nullable
            cashOnDelivery: productCashOnDelivery === 'Yes', // Convert to boolean
            warranty: productWarranty || null, // Allow warranty to be nullable
            returnPolicy: productReturnPolicy || null, // Allow returnPolicy to be nullable
            category: productCategory, // Required field
            isDeleted: false, // Set default as false
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // Save product to the database
        await newProduct.save();

        // Redirect or respond with success
        return res.redirect('/admin/productManagement');
    } catch (error) {
        console.error('Error posting product:', error);

        // Respond with an error
        res.status(500).json({
            success: false,
            message: 'Error posting product. Please try again later.',
        });
    }
},

//------updateProduct--------------------->

async loadUpdateProduct (req, res) {
    const productId = req.params.id; // Get productId from URL parameter
    console.log(productId);

    try {
        const product = await Products.findById(productId).populate('category'); // Find product by ID
        const categories = await Category.find();
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Render the update page with the product data
        res.render('admin/productUpdate', { product, categories });
    } catch (error) {
        console.error('Error loading product update page:', error);
        res.status(500).json({ message: 'Error loading product update page' });
    }
},

async updateProduct(req, res) {
    const productId = req.params.id;
    console.log("the product id ---->>>" + productId);
    // console.log(req.body);
    
    const {
        productName,
        productDescription,
        productPrice,
        productOfferPrice,
        productStock,
        productCategory,
    } = req.body;

    // Check if files were uploaded
    if (!req.files) {
        return res.status(404).json({ message: "No images uploaded" });
    }
    
    // console.log("the req . file is this >>>>" + req.files); // Log the files for debugging

    try {
        const product = await Products.findById(productId);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Update product fields
        product.name = productName;
        product.description = productDescription;
        product.price = parseFloat(productPrice);
        product.offerPrice = parseFloat(productOfferPrice);
        product.stock = parseInt(productStock, 10);
        product.category = productCategory;
        product.updatedAt = Date.now();

        // Handle uploaded images if they exist
        const imagePaths = [];
        for (const key in req.files) {
            if (Object.prototype.hasOwnProperty.call(req.files, key)) {
                req.files[key].forEach((file) => {
                    const relativePath = file.path.replace(/\\/g, '/').split('public')[1]; // Ensure consistent path formatting
                    imagePaths.push(relativePath);
                });
            }
        }

        // If new images were uploaded, update the product images
        if (imagePaths.length > 0) {
            product.images = imagePaths; // Update images if new ones are uploaded
        }

        await product.save();
        res.status(200).json({ success: true, message: 'Successfully updated product', product });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ success: false, message: 'Error updating product' });
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
    console.log(id);

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