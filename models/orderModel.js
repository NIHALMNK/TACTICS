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
    username: {
        type: String,
        required: true
    },
    shippingAddress: {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        house: { type: String, required: true },
        street: { type: String, required: true },
        landmark: { type: String },
        city: { type: String, required: true },
        district: { type: String, required: true },
        state: { type: String, required: true },
        country: { type: String, required: true },
        pinCode: { type: Number, required: true }
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
            size: {
                type: String,
                required: true
            },
            price: {
                type: Number,
            }
        }
    ],
    discount: {
        type: Number,
        default: 0
    },
    couponDiscount: {
        type: Number,
        default: 0
    },
    totalDiscount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['Pending', 'Cancelled', 'Shipping', 'Completed', 'Returned', 'Requested', 'Rejected'],
        default: 'Pending'
    },
    refundReason: {
        type: String,
        default: null
    },
    cancelReason:{
        type:String,
        default:null
    },
    paymentMethod: {
        type: String,
        enum: ['cod', 'razorpay'],
        default: 'cod'
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed','Refunded'],
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
    },

    createdAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        index: { expireAfterSeconds: 0 }
    }
})


function generateOrderId() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}


orderSchema.pre('validate', async function (next) {
    if (!this.orderId) {
        let isUnique = false;
        let newOrderId;


        while (!isUnique) {
            newOrderId = generateOrderId();

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