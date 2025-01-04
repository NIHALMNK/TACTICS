const User = require("../../models/userRegister");
const productModel = require("../../models/productModel");
const cartModel = require("../../models/CartModel");
const orderModel = require("../../models/orderModel")

module.exports = {
    loadCheckout: async (req, res) => {
        try {
            const userId = req.session.user.id;
            
            const userData = await User.findById(userId);
            if (!userData) {
                return res.status(404).redirect('/login');
            }

            const cart = await cartModel.findOne({ userId })
                .populate({
                    path: 'items.productId',
                    model: 'Product',
                    select: 'name price offerPrice images'
                });

            if (!cart || !cart.items.length) {
                return res.redirect('/cart');
            }

            const validItems = cart.items.filter(item => item.productId != null);

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

            // console.log("address id -----------> "+userData.address[0].id);

            const addresses = userData.address.map(addr => ({
                id: addr.id,
                name: userData.name,
                phone: userData.phone,
                house: addr.house,
                street: addr.street,
                landmark: addr.landmark,
                city: addr.city,
                district: addr.district,
                country: addr.country,
                state: addr.state,
                pinCode: addr.pinCode,
         
            }));

            console.log("address -----------> "+addresses);
            

            const itemsWithDefaultImage = validItems.map(item => {
                if (!item.productId.images || !item.productId.images.length) {
                    item.productId.images = [''];
                }
                return item;
            });

            res.render('user/checkout', {
                addresses,
                cartItems: itemsWithDefaultImage,
                subtotal: totals.subtotal,
                shipping,
                discount,
                total,
                user: userData,
                mrp: totals.mrp,
                offerTotal: totals.subtotal
            });

        } catch (error) {
            console.error('Error in loadCheckout:', error);
            res.status(500).render('error', { 
                message: 'Something went wrong while loading the checkout page',
                error: process.env.NODE_ENV === 'development' ? error : {}
            });
        }
    },



    //---------------------------------------------------------------->


    async placeOrder(req, res) {
        try {
            const { addressid, selectedPayment } = req.body;
            const userId = req.session.user.id;
    
            console.log("addressid:", addressid);
            console.log("selectedPayment:", selectedPayment);
            console.log("userId:", userId);
    
            const cart = await cartModel.findOne({ userId })
                .populate({
                    path: 'items.productId',
                    model: 'Product',
                    select: 'name price offerPrice stockManagement'
                });
    
            if (!cart || !cart.items.length) {
                return res.redirect('/cart');
            }
    
            const validItems = cart.items.filter(item => item.productId && item.productId.stockManagement.length > 0);
    
            const totals = validItems.reduce((acc, item) => {
                const productStock = item.productId.stockManagement.find(stock => stock.size === item.size);
                if (!productStock || productStock.quantity < item.quantity) {
                    throw new Error(`Insufficient stock for ${item.productId.name} (Size: ${item.size})`);
                }
    
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
    
            
            const newOrder = await orderModel.create({
                userId,
                addressId: addressid,
                totalAmount: total,
                orderItems: validItems.map(item => ({
                    productId: item.productId._id,
                    quantity: item.quantity,
                    price: item.productId.offerPrice,
                })),
                paymentMethod: selectedPayment,
                paymentStatus: selectedPayment === 'Cash on Delivery' ? 'Pending' : 'Completed',
            });
    
            cart.items = [];
            await cart.save();

            for (let item of validItems) {
                const product = await productModel.findById(item.productId._id);
                const sizeStock = product.stockManagement.find(stock => stock.size === item.size);
    
                if (!sizeStock || sizeStock.quantity < item.quantity) {
                    throw new Error(`Insufficient stock for ${product.name} (Size: ${item.size})`);
                }
    
                sizeStock.quantity -= item.quantity;
                await product.save();
            }
    
            console.log('Order placed successfully:', newOrder);

            const orderId = newOrder._id;
            console.log("orderId--->"+orderId);
            
            res.json({ success: true, orderId });
        } catch (error) {
            console.error('Error in placeOrder:', error.message);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    
    async loadPaymentSuccess(req, res) {
        try {
            const orderId = req.params.orderId;
            
            console.log("orderID-->", orderId);
            
            if (!orderId) {
                return res.status(400).render('error', {
                    message: 'Invalid Order ID'
                });
            }
    
            const order = await orderModel.findById(orderId)
                .populate('userId');
    
            if (!order) {
                return res.status(404).render('error', {
                    message: 'Order not found'
                });
            }
    
            res.render('user/success', {
                orderId: order._id,
                amount: order.totalAmount,
                paymentStatus: order.paymentStatus,
                orderDate: order.orderDate
            });
    
        } catch (error) {
            console.error('Error in loadPaymentSuccess:', error);
            res.status(500).render('error', {
                message: 'Error loading payment success page',
                error: process.env.NODE_ENV === 'development' ? error : {}
            });
        }
    }


    
    

};