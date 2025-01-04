const mongoose = require('mongoose');


const stockSchema = new mongoose.Schema({
    size: {
        type: String,
        required: [true, 'Size is required.'],
        trim: true
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required.'],
        min: [0, 'Quantity must be a non-negative number.'],
        default: 0
    }
});

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required.'],
        trim: true,
        maxlength: [100, 'Product name cannot exceed 100 characters.']
    },
    description: {
        type: String,
        required: [true, 'Product description is required.'],
        maxlength: [1000, 'Description cannot exceed 1000 characters.']
    },
    price: {
        type: Number,
        required: [true, 'Price is required.'],
        min: [0, 'Price must be a positive number.']
    },
    offerPrice: {
        type: Number,
        validate: {
            validator: function (v) {
                return v === undefined || v === null || v >= 0;
            },
            message: 'Offer price must be a non-negative number.'
        }
    },
    stockManagement: {
        type: [stockSchema],
        default: [],
        validate: {
            validator: function (stocks) {
                return Array.isArray(stocks) && stocks.length > 0;
            },
            message: 'At least one stock entry is required.'
        }
    },
    images: [
        {
            type: String
        }
    ],
    tags: {
        type: [String],
        default: [],
        validate: {
            validator: function (tags) {
                return tags.every(tag => typeof tag === 'string' && tag.trim().length > 0);
            },
            message: 'Tags must be non-empty strings.'
        }
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Category is required.']
    },
    type: {
        type: String,
        required: [true, 'Product type is required.'],
        enum: ['TopWare', 'BottomWare']
    },
    brand: {
        type: String,
        trim: true,
        maxlength: [50, 'Brand name cannot exceed 50 characters.']
    },
    warranty: {
        type: String,
        trim: true,
        maxlength: [100, 'Warranty information cannot exceed 100 characters.']
    },
    returnPolicy: {
        type: String,
        trim: true,
        maxlength: [100, 'Return policy cannot exceed 100 characters.']
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});


productSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Product', productSchema);
