const Order = require('../../models/orderModel');
const User = require('../../models/userRegister');
const Product = require('../../models/productModel');
const wallet=require('../../models/walletModel');


const orderController = {
  
    loadOrders: async (req, res) => {
      try {
        const userId = req.session.user.id;
        
        // First get the user to access their addresses
        const user = await User.findById(userId);
        
        const orders = await Order.find({ userId })
          .populate('orderItems.productId')
          .sort({ createdAt: -1 });
  
        const formattedOrders = orders.map(order => {
          // Find the matching address from user's address array
          const shippingAddress = user.address.find(addr => 
            addr._id.toString() === order.addressId.toString()
          );
  
          const totals = order.orderItems.reduce((acc, item) => {
            const mrpTotal = item.productId.price * item.quantity;
            const offerTotal = item.productId.offerPrice * item.quantity;
            
            acc.mrp += mrpTotal;
            acc.subtotal += offerTotal;
            return acc;
          }, { mrp: 0, subtotal: 0 });
  
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

          
  
          return {
            orderId: order._id,
            orderDate: order.createdAt,
            items: order.orderItems.map(item => ({
              name: item.productId.name,
              quantity: item.quantity,
              price: item.productId.offerPrice,
              mrp: item.productId.price,
              total: item.productId.offerPrice * item.quantity,
              mrpTotal: item.productId.price * item.quantity,
              discount: (item.productId.price - item.productId.offerPrice) * item.quantity
            })),
            mrp: totals.mrp,
            subtotal: totals.subtotal,
            shipping: shipping,
            discount: discount,
            total: total,
            status: order.status,
            shippingAddress: shippingAddress ? {
              house: shippingAddress.house,
              street: shippingAddress.street,
              city: shippingAddress.city,
              state: shippingAddress.state,
              district: shippingAddress.district,
              landmark: shippingAddress.landmark,
              pinCode: shippingAddress.pinCode
            } : null,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus
          };
        });
  
        res.render('user/order', { 
          orders: formattedOrders,
          user: req.session.user.id
        });
      } catch (error) {
        console.error('Error loading orders:', error);
        res.status(500).render('error', { 
          message: 'Failed to load orders',
          error: process.env.NODE_ENV === 'development' ? error : {}
        });
      }
    },
  
    getOrderDetails: async (req, res) => {
      try {
        const orderId = req.params.orderId;
        
        const order = await Order.findById(orderId)
          .populate('orderItems.productId')
          .populate('addressId');
  
        if (!order) {
          return res.status(404).json({ message: 'Order not found' });
        }
  
        const totals = order.orderItems.reduce((acc, item) => {
          const mrpTotal = item.productId.price * item.quantity;
          const offerTotal = item.productId.offerPrice * item.quantity;
          
          acc.mrp += mrpTotal;
          acc.subtotal += offerTotal;
          return acc;
        }, { mrp: 0, subtotal: 0 });
  
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
  
        res.json({
          order: {
            id: order._id,
            date: order.createdAt,
            status: order.status,
            items: order.orderItems.map(item => ({
              name: item.productId.name,
              quantity: item.quantity,
              price: item.productId.offerPrice,
              mrp: item.productId.price,
              total: item.productId.offerPrice * item.quantity,
              mrpTotal: item.productId.price * item.quantity,
              discount: (item.productId.price - item.productId.offerPrice) * item.quantity
            })),
            mrp: totals.mrp,
            subtotal: totals.subtotal,
            shipping: shipping,
            discount: discount,
            total: total,
            address: order.addressId,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus
          }
        });
      } catch (error) {
        console.error('Error getting order details:', error);
        res.status(500).json({ message: 'Failed to get order details' });
      }
    },
  

    requestReturn: async (req, res) => {
      try {
        const { reason, orderId } = req.body;
        const userId = req.session.user.id;
  
        const order = await Order.findById(orderId);
  
        if (!order) {
          return res.status(404).json({ message: 'Order not found' });
        }
  
        if (order.status !== 'Completed') {
          return res.status(400).json({ message: 'Order cannot be returned' });
        }
  
        // Calculate refund amount (total order amount)
        const refundAmount = order.totalAmount;
  
        // Update wallet balance
        let walletData = await wallet.findOne({ userId });
        
        if (!walletData) {
          // Create new wallet if it doesn't exist
          walletData = await wallet.create({
            userId: userId,
            balance: refundAmount,
            transactionHistory: [{
              transactionType: "CREDIT",
              transactionAmount: refundAmount,
              transactionDate: new Date(),
              description: `Refund for returned order #${orderId}`
            }]
          });
        } else {
          // Update existing wallet
          walletData.balance += refundAmount;
          walletData.transactionHistory.push({
            transactionType: "CREDIT",
            transactionAmount: refundAmount,
            transactionDate: new Date(),
            description: `Refund for returned order #${orderId}`
          });
          await walletData.save();
        }
  
        // Update order status and save return reason
        order.status = 'Requested';
        order.refundReason = reason;
        await order.save();
  
        // Update product quantities back to inventory
        for (const item of order.orderItems) {
          const product = await Product.findById(item.productId);
          if (product) {
            product.quantity += item.quantity;
            await product.save();
          }
        }
  
        return res.json({ 
          success: true,
          message: 'Return requested successfully and refund initiated' 
        });
  
      } catch (error) {
        console.error('Error requesting return:', error);
        res.status(500).json({ 
          success: false,
          message: 'Failed to request return' 
        });
      }
    },

  async cancelOrder(req, res) {
    try {
      const userId = req.session.user.id;
      const orderId = req.params.orderId;
      const order = await Order.findById(orderId);

      if (!order) {
        return res.status(404).json({ 
          success: false, 
          message: 'Order not found' 
        });
      }

      if (order.status !== 'Pending') {
        return res.status(400).json({ 
          success: false, 
          message: 'Only pending orders can be cancelled' 
        });
      }

      // Update product quantities
      for (const item of order.orderItems) {
        const product = await Product.findById(item.productId);
        if (product) {
          product.quantity += item.quantity;
          await product.save();
        }
      }

      order.status = 'Cancelled';
      
      // Handle refund for all online payment methods
      if (order.paymentMethod !== 'COD') {
        let walletData = await wallet.findOne({ userId });
        if (!walletData) {
          walletData = await wallet.create({
            userId: userId,
            balance: order.totalAmount,
            transactionHistory: [{
              transactionType: "CREDIT", // Changed from "credit" to "CREDIT"
              transactionAmount: order.totalAmount,
              transactionDate: new Date(),
              description: `Refund for order #${order._id}`
            }],
          });
        } else {
          walletData.balance += order.totalAmount;
          walletData.transactionHistory.push({
            transactionType: "CREDIT", // Changed from "credit" to "CREDIT"
            transactionAmount: order.totalAmount,
            transactionDate: new Date(),
            description: `Refund for order #${order._id}`
          });
          await walletData.save();
        }
      }

      await order.save();

      res.json({ 
        success: true, 
        message: 'Order cancelled successfully' 
      });

    } catch (error) {
      console.error('Error cancelling order:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to cancel order' 
      });
    }
  },


 
  
};

function formatAddress(addressObj) {
  if (!addressObj) return 'Address not available';
  return `${addressObj.house}, ${addressObj.street}, ${addressObj.city}, ${addressObj.state}, ${addressObj.pinCode}`;
}



module.exports = orderController;