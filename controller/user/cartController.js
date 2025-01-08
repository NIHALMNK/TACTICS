const User = require("../../models/userRegister");
const productModel = require("../../models/productModel");
const cartModel = require("../../models/CartModel");

module.exports = {
    
    async LoadCart(req, res) {
        try {
            const userID = req.session.user?.id;

           
    
            if (!userID) {
                // console.log("User not logged in");
                return res.redirect('/login');
            }
    
            const cart = await cartModel.findOne({ userId: userID })
                .populate({
                    path: 'items.productId',
                    model: 'Product',
                    select: 'offerPrice price name stockManagement images isDeleted' 
                });
    
            if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
                return res.render("user/cart", {
                    cart: { items: [] },
                    subtotal: 0,
                    shipping: 0,
                    total: 0,
                    user: req.session.user,
                    currentPage: 1,
                    totalPages: 1,
                    mrp: 0,
                    offerTotal: 0,
                    discount: 0
                });
            }

            const validproducts =cart.items.filter(item=>item.productId && !item.productId.isDeleted)

            if (validproducts.length !== cart.items.length) {
                cart.items = validproducts;
                await cart.save();
                
            }
    
            const page = parseInt(req.query.page) || 1;
            const limit = 3;
            const offset = (page - 1) * limit;
            const totalItems = cart.items.length;
            const totalPages = Math.ceil(totalItems / limit);
    
            const validItems = cart.items.filter(item => item.productId != null);
            const paginatedItems = validItems.slice(offset, offset + limit);
    
           
            
            const totals = validItems.reduce((acc, item) => {
                acc.subtotal += item.productId.offerPrice * item.quantity; 
                acc.mrp += item.productId.price * item.quantity;  
                return acc;
            }, { subtotal: 0, mrp: 0 });
    
            let shipping = 0;
            if (totals.subtotal > 0 && totals.subtotal <= 1000) {
                shipping = 200;
            } else if (totals.subtotal > 1000 && totals.subtotal <= 5000) {
                shipping = 150;
            } else if (totals.subtotal > 5000) {
                shipping = 100;
            }
    
            const discount = totals.mrp - totals.subtotal;
            const total = totals.subtotal + shipping;
    
            const itemsWithDefaultImage = paginatedItems.map(item => {
                if (!item.productId.images || !item.productId.images.length) {
                    item.productId.images = ['']; 
                }
                return item;
            });
    
            res.render('user/cart', {
                cart: { items: itemsWithDefaultImage },
                subtotal: totals.subtotal,
                shipping,
                total,
                user: req.session.user,
                offerTotal: totals.subtotal,
                mrp: totals.mrp,
                products: itemsWithDefaultImage,
                currentPage: page,
                totalPages,
                discount
            });
    
        } catch (err) {
            console.error('Error loading cart:', err);
            if (process.env.NODE_ENV === 'development') {
                console.error('Detailed error:', err);
            }
            res.status(500).render('error', { 
                message: 'Error loading cart. Please try again later.',
                error: process.env.NODE_ENV === 'development' ? err : {}
            });
        }
    },
//================================================>
    async cartBadge (req, res){
        try {
            if (req.session.user) {
                const userId = req.session.user.id;
                const cart = await cartModel.findOne({ userId });
                const itemCount = cart ? cart.items.length : 0; 
                res.json({ itemCount });
            } else {
                res.json({ itemCount: 0 }); 
            }
        } catch (err) {
            console.error('Error fetching cart badge:', err);
            res.status(500).json({ error: 'Failed to fetch cart badge' });
        }
    },
//==================================>

    async addToCart (req, res){
        try {
            
            const { productId, size, quantity } = req.body;

            
    
            if (!productId || !size || !quantity) {
                return res.status(400).json({ success: false, message: 'Missing required fields' });
            }
    
            
            const product = await productModel.findById(productId);
    
            if (!product) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }
    
            
            const sizeStock = product.stockManagement.find(stock => stock.size === size);
    
            if (!sizeStock || sizeStock.quantity < quantity) {
                return res.status(400).json({ success: false, message: `Not enough stock for size ${size}` });
            }
    
            
            let {id} = req.session.user;
            if(!id) {
                return res.redirect('/login');
            }

            let cart = await cartModel.findOne({ userId: id }); 
    
            if (!cart) {
               
                cart = new cartModel({ userId: id, items: [] });
            }
    
            
            
            const cartItemIndex = cart.items.findIndex(item => item.productId.toString() === productId && item.size === size);
    
            if (cartItemIndex >= 0) {
                
                cart.items[cartItemIndex].quantity += quantity;
            } else {
                
                cart.items.push({
                    productId: productId,
                    size: size,
                    quantity: quantity
                });
            }
    
            await cart.save();
    
            res.status(200).json({ success: true, message: 'Item added to cart' });
        } catch (error) {
            console.error('Error adding to cart:', error);
            res.status(500).json({ success: false, message: 'Error adding to cart', error: error.message });
        }
    

    
},
//====================================>
async getStock(req, res) {
    try {
        // console.log("req.body===>"+req.body);
        
        const { itemId, size , quantity } = req.body;

            
            

        if (!itemId || !size || !quantity) {
            return res.status(400).json({ success: false, message: 'Product ID and size are required' });
        }

       
       

        

        const product = await productModel.find({ _id: itemId });
        // console.log("product--------->", product);
        

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const sizeStock = product[0].stockManagement.find(stock => stock.size === size);

        // console.log("sizeStock--------->", sizeStock);
        

        if (!sizeStock) {
            return res.status(404).json({ success: false, message: `Stock information for size ${size} not found` });
        }
        
        

        res.status(200).json({ success: true, stock: sizeStock.quantity });
    } catch (error) {
        console.error('Error fetching stock:',  error.message);
        res.status(500).json({ success: false, message: 'Error fetching stock', error: error.message });
    }
},

//====================================>
    async removeFromCart(req, res) {
        try {
            const { productId, size } = req.body;
            
            if (!productId || !size) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Product ID and size are required' 
                });
            }
            
            const { id } = req.session.user;
            const cart = await cartModel.findOne({ userId: id });
    
            if (!cart) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Cart not found' 
                });
            }
    
            let itemIndex = cart.items.findIndex(item => 
                item._id.toString() === productId && item.size === size
            );
    
            if (itemIndex === -1) {
                itemIndex = cart.items.findIndex(item => 
                    item.productId.toString() === productId && item.size === size
                );
            }
    
            if (itemIndex === -1) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Item not found in the cart' 
                });
            }
    
            cart.items.splice(itemIndex, 1);

            await cart.save();
            
            await res.status(200).json({ 
                success: true, 
                message: 'Item removed from cart' 
            });

            
    
        } catch (error) {
            console.error('Error removing from cart:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error removing from cart', 
                error: error.message 
            });
        }
    },
    
//====================================>
async updateQuantity(req, res) {
    try {
        
        const { itemId, size, quantity } = req.body;
        const userId = req.session.user?.id;

        if (!userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'User not logged in' 
            });
        }

        if (!itemId || !size || !quantity) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields' 
            });
        }

        const cart = await cartModel.findOne({ userId })
            .populate({
                path: 'items.productId',
                model: productModel,
                select: 'stockManagement offerPrice'
            });

        if (!cart) {
            return res.status(404).json({ 
                success: false, 
                message: 'Cart not found' 
            });
        }

        const cartItem = cart.items.find(item => 
            item._id.toString() === itemId && item.size === size
        );

        if (!cartItem) {
            return res.status(404).json({ 
                success: false, 
                message: 'Item not found in cart' 
            });
        }

        const product = await productModel.findById(cartItem.productId._id);
        // console.log("product of update---------> " + product);
        
        const sizeStock = product.stockManagement.find(stock => stock.size === size);

        // console.log(`sizeStock----->${sizeStock}`);
        // console.log("quantityStock----->"+quantity);
        
        if(10<quantity){
            return res.status(400).json({ 
                success: false, 
                message: `Cannot exceed more than 10 stock!` 
            });
        }
        

        if (!sizeStock || sizeStock.quantity < quantity) {
            return res.status(400).json({ 
                success: false, 
                message: `Only ${sizeStock ? sizeStock.quantity : 0} items available in stock` 
            });
        }

        cartItem.quantity = quantity;


        await cart.save();

        const totals = cart.items.reduce((acc, item) => {
            acc.subtotal += item.productId.offerPrice * item.quantity;
            return acc;
        }, { subtotal: 0 });

        let shipping = 0;
        if (totals.subtotal > 0 && totals.subtotal <= 1000) {
            shipping = 200;
        } else if (totals.subtotal > 1000 && totals.subtotal <= 5000) {
            shipping = 150;
        } else if (totals.subtotal > 5000) {
            shipping = 100;
        }

        const total = totals.subtotal + shipping;

        res.status(200).json({
            success: true,
            message: 'Quantity updated successfully',
            newQuantity: quantity,
            newSubtotal: totals.subtotal,
            shipping,
            total
            
        });

    } catch (error) {
        console.error('Error updating quantity:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating quantity', 
            error: error.message 
        });
    }
},


};