const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, required: false },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false },
    phone: { type: String, unique: false ,sparse: true, default: null },
    address: [{
        street: { type: String },
        country: { type: String },
        state: { type: String },
        district: { type: String },
        city: { type: String },
        house: { type: String },
        landmark: { type: String },
        pinCode: { type: Number },
    }],
    role: { type: String, default: "user" },
    isDeleted: { type: Boolean, default: false },
    isGoogleLogin: { type: Boolean, default: false },
    googleId: { type: String ,sparse: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    isValid: { type: Boolean, default: false }
});

module.exports = mongoose.model("users", userSchema);