const mongoose = require('mongoose')


const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        unique: true,
        required: true
    },
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
                ref: "Products",
                required: true
            },
            quantity: {
                type: Number,
                required: true
            },
            price: {
                type: Number,
                required: true
            },
            size: {
                type: String,
                required: true
            }
        }
    ],
    status: {
        type: String,
        enum: ['Pending', 'Cancelled', 'Shipping', 'Completed', 'Returned', 'Requested', 'Rejected'],
        default: 'Pending'
    },
    reason: {
        type: String,
        default: null
    },
    paymentMethod: {
        type: String,
        enum: ['Cash on Delivery', 'Net Banking'],
        default: 'Cash on Delivery'
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed'],
        default: 'Pending'
    },
    razorpayOrderId: {  // Add this field to store the Razorpay order ID
        type: String,
        default: null
    },
    razorpayPaymentId: { // Add this field to store Razorpay's payment ID after successful payment
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
        index: { expireAfterSeconds: 0 } // TTL index: document expires at this time
    }
})


function generateOrderId() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Pre-validate middleware to set orderId
orderSchema.pre('validate', async function(next) {
    if (!this.orderId) {
        let isUnique = false;
        let newOrderId;
        
        // Keep trying until we get a unique orderId
        while (!isUnique) {
            newOrderId = generateOrderId();
            // Check if this orderId already exists
            const existingOrder = await this.constructor.findOne({ orderId: newOrderId });
            if (!existingOrder) {
                isUnique = true;
            }
        }
        
        this.orderId = newOrderId;
    }
    next();
});

module.exports = mongoose.model("Orders", orderSchema)