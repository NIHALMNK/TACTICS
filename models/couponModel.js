const mongoose = require('mongoose')


const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true,
    },
    discountValue: {
        type: Number,
        required: true,
        min: 0,
    },
    maxDiscount: {
        type: Number,
        default: null,
    },
    minPurchase: {
        type: Number,
        default: 0,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    usageLimit: {
        type: Number,
        default: null,
    },
    usedCount: {
        type: Number,
        default: 0,
    },
    isActive: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active', 
    },
    
}, {
    timestamps: true,
});

module.exports = mongoose.model("Coupons", couponSchema)