const mongoose = require('mongoose')


const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    },
    addressId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    totalAmount: {
        type: Number,
        required: true
    },
    orderItems: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product"
            },
            quantity: {
                type: Number,
                required: true
            },
            price: {
                type: Number,
            }
        }
    ],
    status: {
        type: String,
        enum: ['Pending', 'Cancelled', 'Shipping', 'Completed', 'Returned', 'Requested', 'Rejected'],
        default: 'Pending'
    },
    refundReason: {
        type: String,
        default: null
    },
    paymentMethod: {
        type: String,
        enum: ['cod', 'Net Banking'],
        default: 'Cash on Delivery'
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed'],
        default: 'Pending'
    },
    razorpayOrderId: {  
        type: String,
        default: null
    },
    razorpayPaymentId: {
        type: String,
        default: null
    },
    coupon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon',
        default: null
    }, // Coupon reference

    createdAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        index: { expireAfterSeconds: 0 } 
    }
})

module.exports = mongoose.model("Orders", orderSchema)