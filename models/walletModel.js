const mongoose = require("mongoose");


const walletSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', 
      required: true
    },
    balance: {
      type: Number,
      default: 0
    },
    // wallet id needed
    transactionHistory: [
      {
        transactionType: {
          type: String,
          enum: ['CREDIT', 'DEBIT'],

          required: true
        },
        transactionAmount: {
          type: Number,
          required: true
        },
        transactionDate: {
          type: Date,
          default: Date.now
        },
        reference: {  
          type: String,
        },
        description: {
          type: String,
          default: ''
        }
      }
    ],
  },{timestamps:true});
  // Add this after your schema definition
walletSchema.index({ 'transactionHistory.reference': 1 }, { unique: true, sparse: true });
  
  module.exports = mongoose.model('Wallets', walletSchema);



  