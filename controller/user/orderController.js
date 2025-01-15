const Order = require('../../models/orderModel');
const User = require('../../models/userRegister');
const Product = require('../../models/productModel');
const wallet=require('../../models/walletModel');
const mongoose = require('mongoose');

const orderController = {
  
    loadOrders: async (req, res) => {
      try {
        const userId = req.session.user.id;
        
        const user = await User.findById(userId);
        
        const orders = await Order.find({ userId })
          .populate('orderItems.productId')
          .sort({ createdAt: -1 });
  
        const formattedOrders = orders.map(order => {
          
  
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
              size:item.size,
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
            shippingAddress: order.shippingAddress,
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
              size:item.size,
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
  
        const refundAmount = order.totalAmount;
  
        let walletData = await wallet.findOne({ userId });
        
        if (!walletData) {
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
         
          walletData.balance += refundAmount;
          walletData.transactionHistory.push({
            transactionType: "CREDIT",
            transactionAmount: refundAmount,
            transactionDate: new Date(),
            description: `Refund for returned order #${orderId}`
          });
          await walletData.save();
        }
  
       
        order.status = 'Requested';
        order.refundReason = reason;
        await order.save();
  
        
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
        
        const order = await Order.findById(orderId)
          .populate('orderItems.productId');
  
        if (!order) {
          return res.status(404).json({ 
            success: false, 
            message: 'Order not found' 
          });
        }
  
        // Validate order ownership and status
        if (order.userId.toString() !== userId) {
          return res.status(403).json({
            success: false,
            message: 'Unauthorized to cancel this order'
          });
        }
  
        if (order.status !== 'Pending') {
          return res.status(400).json({
            success: false,
            message: 'Only pending orders can be cancelled'
          });
        }
  
        // Restock inventory
        for (const orderItem of order.orderItems) {
          const product = await Product.findById(orderItem.productId);
          
          if (!product) {
            console.error(`Product not found for ID: ${orderItem.productId}`);
            continue;
          }
  
          // Find the stock entry for the specific size
          const stockEntry = product.stockManagement.find(
            stock => stock.size === orderItem.size
          );
  
          if (!stockEntry) {
            console.error(`Size ${orderItem.size} not found in stock management for product ${product._id}`);
            continue;
          }
  
          // Update the quantity
          stockEntry.quantity += orderItem.quantity;
          await product.save();
  
          console.log(`Restocked ${orderItem.quantity} units of size ${orderItem.size} for product ${product._id}`);
        }
  
        // Process refund if payment was made
        if (order.paymentMethod !== 'cod' && order.paymentStatus === 'Completed') {
          let walletData = await wallet.findOne({ userId });
          
          if (!walletData) {
            walletData = new wallet({
              userId: userId,
              balance: order.totalAmount,
              transactionHistory: [{
                transactionType: "CREDIT",
                transactionAmount: order.totalAmount,
                transactionDate: new Date(),
                description: `Refund for cancelled order #${order.orderId}`
              }]
            });
          } else {
            walletData.balance += order.totalAmount;
            walletData.transactionHistory.push({
              transactionType: "CREDIT",
              transactionAmount: order.totalAmount,
              transactionDate: new Date(),
              description: `Refund for cancelled order #${order.orderId}`
            });
          }
          await walletData.save();
        }
  
        // Update order status
        order.status = 'Cancelled';
        if (order.paymentStatus === 'Pending') {
          order.paymentStatus = 'Failed';
        }
        
        await order.save();
  
        res.json({ 
          success: true, 
          message: 'Order cancelled successfully and inventory updated' 
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