const User = require("../../models/userRegister");
const productModel = require("../../models/productModel");
const cartModel = require("../../models/CartModel");
const orderModel = require("../../models/orderModel")
const couponModel = require('../../models/couponModel')

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

            const coupens=await couponModel.find()
            console.log(coupens);

            res.render('user/checkout', {
                addresses,
                cartItems: itemsWithDefaultImage,
                subtotal: totals.subtotal,
                shipping,
                discount,
                total,
                user: userData,
                mrp: totals.mrp,
                offerTotal: totals.subtotal,
                coupens,
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


    // async placeOrder(req, res) {
    //     try {
    //         const { addressid, selectedPayment } = req.body;
    //         const userId = req.session.user.id;
    
    //         console.log("addressid:", addressid);
    //         console.log("selectedPayment:", selectedPayment);
    //         console.log("userId:", userId);


    //         const user = await User.findById(userId);

    //         console.log("----------------------------------------------------------------------------------------------------------------->");

    //         console.log(user.name);
            
            
    //         console.log("----------------------------------------------------------------------------------------------------------------->");
            
            
    
    //         const cart = await cartModel.findOne({ userId })
    //             .populate({
    //                 path: 'items.productId',
    //                 model: 'Product',
    //                 select: 'name price offerPrice stockManagement'
    //             });
    
    //         if (!cart || !cart.items.length) {
    //             return res.redirect('/cart');
    //         }
    
    //         const validItems = cart.items.filter(item => item.productId && item.productId.stockManagement.length > 0);
    
    //         const totals = validItems.reduce((acc, item) => {
    //             const productStock = item.productId.stockManagement.find(stock => stock.size === item.size);
    //             if (!productStock || productStock.quantity < item.quantity) {
    //                 throw new Error(`Insufficient stock for ${item.productId.name} (Size: ${item.size})`);
    //             }
    
    //             acc.subtotal += item.productId.offerPrice * item.quantity;
    //             acc.mrp += item.productId.price * item.quantity;
    //             return acc;
    //         }, { subtotal: 0, mrp: 0 });
    
    //         let shipping = 0;
    //         if (totals.subtotal > 0 && totals.subtotal <= 1000) {
    //             shipping = 200;
    //         } else if (totals.subtotal > 1000 && totals.subtotal <= 5000) {
    //             shipping = 150;
    //         } else if (totals.subtotal > 5000) {
    //             shipping = 100;
    //         }
    
    //         const discount = totals.mrp - totals.subtotal;
    //         const total = totals.subtotal + shipping;


    
            
    //         const newOrder = await orderModel.create({
    //             userId,
    //             username:user.name,
    //             addressId: addressid,
    //             totalAmount: total,
    //             orderItems: validItems.map(item => ({
    //                 productId: item.productId._id,
    //                 quantity: item.quantity,
    //                 price: item.productId.offerPrice,
    //             })),
    //             paymentMethod: selectedPayment,
    //             paymentStatus: selectedPayment === 'cod' ? 'Pending' : 'Completed',
    //         });
    
    //         cart.items = [];
           
            
    //         await cart.save();

    //         for (let item of validItems) {
    //             const product = await productModel.findById(item.productId._id);
    //             const sizeStock = product.stockManagement.find(stock => stock.size === item.size);
    
    //             if (!sizeStock || sizeStock.quantity < item.quantity) {
    //                 throw new Error(`Insufficient stock for ${product.name} (Size: ${item.size})`);
    //             }
    
    //             sizeStock.quantity -= item.quantity;
    //             await product.save();
    //         }
    
    //         console.log('Order placed successfully:', newOrder);

    //         const orderId = newOrder._id;
    //         console.log("orderId--->"+orderId);
            
    //         res.json({ success: true, orderId });
    //     } catch (error) {
    //         console.error('Error in placeOrder:', error.message);
    //         res.status(500).json({ success: false, message: error.message });
    //     }
    // },

     //---------------------------------------------------------------->
    
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
    },


     //---------------------------------------------------------------->

     async validateCoupon(req, res) {
        try {
            const { code, totalAmount } = req.body;
            const userId = req.session.user.id;
            
            const coupon = await couponModel.findOne({
                code: code,
                isActive: 'Active',
                startDate: { $lte: new Date() },
                endDate: { $gte: new Date() }
            });
    
            if (!coupon) {
                return res.json({
                    success: false,
                    message: 'Invalid or expired coupon'
                });
            }
    
            if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
                return res.json({
                    success: false,
                    message: 'Coupon usage limit exceeded'
                });
            }
    
            if (totalAmount < coupon.minPurchase) {
                return res.json({
                    success: false,
                    message: `Minimum purchase amount of ₹${coupon.minPurchase} required`
                });
            }
    
            let discount = coupon.discountType === 'percentage' 
                ? (totalAmount * coupon.discountValue) / 100 
                : coupon.discountValue;
    
            if (coupon.maxDiscount && discount > coupon.maxDiscount) {
                discount = coupon.maxDiscount;
            }

            // Store coupon data in session for use during order placement
            req.session.appliedCoupon = {
                couponId: coupon._id,
                discount: discount
            };
    
            res.json({
                success: true,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                discount: discount,
                couponId: coupon._id
            });
    
        } catch (error) {
            console.error('Error validating coupon:', error);
            res.status(500).json({
                success: false,
                message: 'An error occurred while validating the coupon'
            });
        }
    },

    async placeOrder(req, res) {
        try {
            const { addressid, selectedPayment } = req.body;
            const userId = req.session.user.id;
            const appliedCoupon = req.session.appliedCoupon;

            const user = await User.findById(userId);
            
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
            let total = totals.subtotal + shipping;

            // Apply coupon discount if available
            if (appliedCoupon && appliedCoupon.couponId) {
                total -= appliedCoupon.discount;

                // Update coupon usage count
                await couponModel.findByIdAndUpdate(
                    appliedCoupon.couponId,
                    { $inc: { usedCount: 1 } }
                );
            }
            
            const orderData = {
                userId,
                username: user.name,
                addressId: addressid,
                totalAmount: total,
                orderItems: validItems.map(item => ({
                    productId: item.productId._id,
                    quantity: item.quantity,
                    price: item.productId.offerPrice,
                })),
                paymentMethod: selectedPayment,
                paymentStatus: selectedPayment === 'cod' ? 'Pending' : 'Completed',
            };

            // Add coupon information if applied
            if (appliedCoupon && appliedCoupon.couponId) {
                orderData.coupon = appliedCoupon.couponId;
                orderData.discountAmount = appliedCoupon.discount;
            }
    
            const newOrder = await orderModel.create(orderData);
    
            // Clear the cart and update stock
            cart.items = [];
            await cart.save();

            // Clear the applied coupon from session
            delete req.session.appliedCoupon;

            // Update product stock
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
            
            res.json({ success: true, orderId: newOrder._id });
        } catch (error) {
            console.error('Error in placeOrder:', error.message);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    
    

};