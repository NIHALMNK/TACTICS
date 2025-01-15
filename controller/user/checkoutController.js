const User = require("../../models/userRegister");
const productModel = require("../../models/productModel");
const cartModel = require("../../models/CartModel");
const orderModel = require("../../models/orderModel")
const couponModel = require('../../models/couponModel')
const razorpay = require('../../utils/razorpay')
const crypto = require('crypto')

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

            console.log("address -----------> " + addresses);


            const itemsWithDefaultImage = validItems.map(item => {
                if (!item.productId.images || !item.productId.images.length) {
                    item.productId.images = [''];
                }
                return item;
            });

            const coupens = await couponModel.find()
            

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
            const COD_LIMIT = 20000; 

            const user = await User.findById(userId);

            const selectedAddress = user.address.find(addr => 
                addr._id.toString() === addressid
            );

            if (!selectedAddress) {
                throw new Error('Selected address not found');
            }
    

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

            if (appliedCoupon && appliedCoupon.couponId) {
                total -= appliedCoupon.discount;

                await couponModel.findByIdAndUpdate(
                    appliedCoupon.couponId,
                    { $inc: { usedCount: 1 } }
                );
            }
            if (selectedPayment === 'cod' && total > COD_LIMIT) {
                return res.status(400).json({
                    success: false,
                    message: `Cash on Delivery is not available for orders above ₹${COD_LIMIT.toLocaleString()}. Please choose online payment.`
                });
            }
            

            

            const orderData = {
                userId,
                username: user.name,
                shippingAddress: {
                    name: user.name,
                    phone: user.phone,
                    house: selectedAddress.house,
                    street: selectedAddress.street,
                    landmark: selectedAddress.landmark,
                    city: selectedAddress.city,
                    district: selectedAddress.district,
                    state: selectedAddress.state,
                    country: selectedAddress.country,
                    pinCode: selectedAddress.pinCode
                },
                totalAmount: total,
                orderItems: validItems.map(item => ({
                    productId: item.productId._id,
                    size:item.size,
                    quantity: item.quantity,
                    price: item.productId.offerPrice,
                })),
                discount: discount, 
                couponDiscount: appliedCoupon?.discount || 0, 
                totalDiscount: discount + (appliedCoupon?.discount || 0), 
                paymentMethod: selectedPayment,
                paymentStatus: selectedPayment === 'cod' ? 'Pending' : 'Completed',
            };

            console.log(orderData);
            

            if (appliedCoupon && appliedCoupon.couponId) {
                orderData.coupon = appliedCoupon.couponId;
                orderData.discountAmount = appliedCoupon.discount;
            }

            const newOrder = await orderModel.create(orderData);

            cart.items = [];
            await cart.save();

            delete req.session.appliedCoupon;

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
    },


    //==========================================================>

    async createRazorpayOrder(req, res) {
        try {
            const { addressid } = req.body;
            const userId = req.session.user.id;

            const cart = await cartModel.findOne({ userId })
                .populate({
                    path: 'items.productId',
                    model: 'Product',
                    select: 'name price offerPrice stockManagement'
                });

            if (!cart || !cart.items.length) {
                return res.status(400).json({
                    success: false,
                    message: 'Cart is empty'
                });
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


            if (req.session.appliedCoupon && req.session.appliedCoupon.couponId) {
                total -= req.session.appliedCoupon.discount;
            }


            const options = {
                amount: total * 100,
                currency: "INR",
                receipt: `order_${Date.now()}`
            };

            const order = await razorpay.orders.create(options);

            res.json({
                success: true,
                order_id: order.id,
                amount: total * 100,
                key_id: process.env.RAZORPAY_KEY_ID,
            });

        } catch (error) {
            console.error('Error creating Razorpay order:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error creating payment order'
            });
        }
    },

    async verifyRazorpayPayment(req, res) {
        try {
            const {
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
                addressid
            } = req.body;
    
            // Verify Razorpay signature
            const sign = razorpay_order_id + "|" + razorpay_payment_id;
            const expectedSign = crypto
                .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
                .update(sign)
                .digest("hex");
    
            if (razorpay_signature !== expectedSign) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid payment signature"
                });
            }
    
            const userId = req.session.user.id;
    
            // Fetch user and cart data in parallel
            const [user, cart] = await Promise.all([
                User.findById(userId),
                cartModel.findOne({ userId }).populate({
                    path: 'items.productId',
                    model: 'Product',
                    select: 'name price offerPrice stockManagement'
                })
            ]);
    
            // Get selected address
            const selectedAddress = user.address.find(addr => addr._id.toString() === addressid);
            if (!selectedAddress) {
                throw new Error('Selected address not found');
            }
    
            if (!cart || !cart.items.length) {
                throw new Error('Cart is empty');
            }
    
            const validItems = cart.items.filter(item =>
                item.productId && item.productId.stockManagement.length > 0
            );
    
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
            let total = totals.subtotal + shipping;
    
            const appliedCoupon = req.session.appliedCoupon;
            if (appliedCoupon && appliedCoupon.couponId) {
                total -= appliedCoupon.discount;
            }
    
            const orderData = {
                userId,
                username: user.name,
                shippingAddress: {
                    name: user.name,
                    phone: user.phone,
                    house: selectedAddress.house,
                    street: selectedAddress.street,
                    landmark: selectedAddress.landmark || '',
                    city: selectedAddress.city,
                    district: selectedAddress.district,
                    state: selectedAddress.state,
                    country: selectedAddress.country,
                    pinCode: selectedAddress.pinCode
                },
                totalAmount: total,
                orderItems: validItems.map(item => ({
                    productId: item.productId._id,
                    quantity: item.quantity,
                    size: item.size,
                    price: item.productId.offerPrice,
                })),
                discount: discount,
                couponDiscount: appliedCoupon?.discount || 0,
                totalDiscount: discount + (appliedCoupon?.discount || 0),
                paymentMethod: 'razorpay',
                paymentStatus: 'Completed',
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id
            };
    
            if (appliedCoupon && appliedCoupon.couponId) {
                orderData.coupon = appliedCoupon.couponId;
                orderData.discountAmount = appliedCoupon.discount;
    
                await couponModel.findByIdAndUpdate(
                    appliedCoupon.couponId,
                    { $inc: { usedCount: 1 } }
                );
            }
    
            const newOrder = await orderModel.create(orderData);
    
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
    
            // Clear cart and coupon
            cart.items = [];
            await cart.save();
            delete req.session.appliedCoupon;
    
            res.json({
                success: true,
                orderId: newOrder._id
            });
    
        } catch (error) {
            console.error('Error verifying payment:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error verifying payment'
            });
        }
    },





};