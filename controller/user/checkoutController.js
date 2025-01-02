const User = require("../../models/userRegister");
const productModel = require("../../models/productModel");
const cartModel = require("../../models/CartModel");

module.exports = {  
    async loadCheckout(req, res) {
        try {
            const userID = req.session.user?.id;
            if (!userID) {
                return res.redirect('/login');
            }
            console.log('cart',cartModel )
            
            const cart = await cartModel.findOne({ userId: userID })
                .populate({
                    path: 'items.productId',
                    select: 'name offerPrice price images'
                });

            if (!cart || !cart.items.length) {
                return res.redirect('/cart');
            }

            // Get user details including addresses
            const user = await User.findById(userID);
            if (!user) {
                return res.redirect('/login');
            }

            // Calculate totals
            const totals = cart.items.reduce((acc, item) => {
                acc.subtotal += item.productId.offerPrice * item.quantity;
                acc.mrp += item.productId.price * item.quantity;
                return acc;
            }, { subtotal: 0, mrp: 0 });

            // Calculate shipping
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

            // Render checkout page with all necessary data
            res.render('user/checkout', {
                addresses: user.address || [],
                cart: cart,
                subtotal: totals.subtotal,
                shipping: shipping,
                discount: discount,
                total: total,
                user: req.session.user
            });

        } catch (error) {
            console.error('Error loading checkout:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error loading checkout page'
            });
        }
    },











};