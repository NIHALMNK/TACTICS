const Order = require('../../models/orderModel');
const User = require('../../models/userRegister');
const Product = require('../../models/productModel');
const  wallet=require('../../models/walletModel');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const mongoose = require('mongoose');
const Razorpay = require('razorpay'); 
const crypto = require('crypto');


const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

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
        const userId = req.session.user.id;
        const addressId = req.params.addressId || req.body.addressId; // Ensure addressId is retrieved
    
        const order = await Order.findOne(orderId)
          .populate('orderItems.productId');
    
        if (!order) {
          
          
          return res.status(404).json({ message: 'Order not found' });
        }
    
        const user = await User.findById(userId);
    
        if (!user || !user.address) {
          return res.status(404).json({ success: false, message: 'User or address not found' });
        }
    
        const selectedAddress = user.address.find(addr => addr._id && addr._id.toString() === addressId);
    
        if (!selectedAddress) {
          return res.status(404).json({ success: false, message: 'Selected address not found' });
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
              size: item.size,
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
            address: selectedAddress,
            paymentStatus: order.paymentStatus,
            paymentMethod: order.paymentMethod
          }
        });
      } catch (error) {
        console.error('Error getting order details:', error);
        res.status(500).json({ message: 'Failed to get order details' });
      }
    },
  

    async  requestReturn (req, res) {
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
        const { reason } = req.body;
        
        console.log(reason);
        
        const order = await Order.findById(orderId).populate('orderItems.productId');
    
        if (!order) {
          return res.status(404).json({
            success: false,
            message: 'Order not found',
          });
        }
    
        
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
          
                for (const orderItem of order.orderItems) {
                  const product = await Product.findById(orderItem.productId);
                  
                  if (!product) {
                    console.error(`Product not found for ID: ${orderItem.productId}`);
                    continue;
                  }
          
                  const stockEntry = product.stockManagement.find(
                    stock => stock.size === orderItem.size
                  );
          
                  if (!stockEntry) {
                    console.error(`Size ${orderItem.size} not found in stock management for product ${product._id}`);
                    continue;
                  }
          
                  stockEntry.quantity += orderItem.quantity;
                  await product.save();
          
                  console.log(`Restocked ${orderItem.quantity} units of size ${orderItem.size} for product ${product._id}`);
                }
    
        if (order.paymentMethod !== 'cod' && order.paymentStatus === 'Completed') {
          try {
            let walletData = await wallet.findOne({ userId });
            const transactionRef = `REFUND-${orderId}-${Date.now()}`;
    
            if (!walletData) {
              walletData = new wallet({
                userId: userId,
                balance: order.totalAmount,
                transactionHistory: [{
                  transactionType: "CREDIT",
                  transactionAmount: order.totalAmount,
                  transactionDate: new Date(),
                  reference: transactionRef,
                  description: `Refund for cancelled order #${orderId}`
                }]
              });
            } else {
              walletData.balance += order.totalAmount;
              walletData.transactionHistory.push({
                transactionType: "CREDIT",
                transactionAmount: order.totalAmount,
                transactionDate: new Date(),
                reference: transactionRef,
                description: `Refund for cancelled order #${orderId}`
              });
            }
    
            await walletData.save();
          } catch (walletError) {
            console.error('Wallet update error:', walletError);
            return res.status(500).json({
              success: false,
              message: 'Failed to process refund'
            });
          }
        }
    
        order.status = 'Cancelled';
        order.cancelReason=reason;
        if (order.paymentStatus === 'Pending') {
          order.paymentStatus = 'Failed';
        }
    
        await order.save();
    
        res.json({
          success: true,
          message: 'Order cancelled successfully and inventory updated',
        });
    
      } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to cancel order',
        });
      }
    },

    async generatePDF(req, res) {
      try {
            const orderId = req.params.orderId;
            const userId = req.session.user.id;
        
            const order = await Order.findOne({ _id: orderId, userId })
              .populate('orderItems.productId');
        
            if (!order) {
              return res.status(404).json({ success: false, message: 'Order not found' });
            }
        
            const doc = new PDFDocument({ margin: 50 });
        
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=order-${orderId}-receipt.pdf`);
            doc.pipe(res);
        
            const drawTableLine = (y) => {
              doc.moveTo(50, y).lineTo(550, y).stroke();
            };
        
            const createTableRow = (items, y, isHeader = false) => {
              const columns = {
                item: { x: 50, width: 180 },
                size: { x: 230, width: 60 },
                qty: { x: 290, width: 60 },
                price: { x: 350, width: 100 },
                total: { x: 450, width: 100 }
              };
        
              if (isHeader) {
                doc.font('Helvetica-Bold');
              } else {
                doc.font('Helvetica');
              }
        
              Object.keys(columns).forEach((col, index) => {
                const text = items[index] || '';
                doc.text(text, columns[col].x, y, {
                  width: columns[col].width,
                  align: ['item'].includes(col) ? 'left' : 'center'
                });
              });
        
              return y + 25;
            };
        
            doc.fontSize(24).font('Helvetica-Bold').text('TACTICS', { align: 'center' });
            doc.fontSize(16).text('Order Receipt', { align: 'center' });
            doc.moveDown();
        
            doc.fontSize(12).font('Helvetica');
            const orderInfoY = doc.y;
            
            doc.text('Order Information:', 50, orderInfoY);
            doc.font('Helvetica');
            doc.text(`Order ID: #${orderId}`, 50, orderInfoY + 20);
            doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 50, orderInfoY + 40);
            doc.text(`Status: ${order.status}`, 50, orderInfoY + 60);
        
            doc.font('Helvetica-Bold');
            doc.text('Shipping Address:', 300, orderInfoY);
            doc.font('Helvetica');
            doc.text(`${order.shippingAddress.house}`, 300, orderInfoY + 20);
            doc.text(`${order.shippingAddress.street}`, 300, orderInfoY + 40);
            doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state}`, 300, orderInfoY + 60);
            doc.text(`PIN: ${order.shippingAddress.pinCode}`, 300, orderInfoY + 80);
        
            doc.moveDown(5);
        
            const tableTop = doc.y;
            drawTableLine(tableTop);
            let currentY = createTableRow(
              ['Item', 'Size', 'Qty', 'Price', 'Total'],
              tableTop + 5,
              true
            );
            drawTableLine(currentY - 5);
        
            order.orderItems.forEach((item, index) => {
              currentY = createTableRow([
                item.productId.name,
                item.size,
                item.quantity.toString(),
                `₹${item.productId.offerPrice}`,
                `₹${item.productId.offerPrice * item.quantity}`
              ], currentY);
              drawTableLine(currentY - 5);
            });
        
            const subtotal = order.orderItems.reduce((sum, item) => 
              sum + (item.productId.offerPrice * item.quantity), 0);
            
            let shipping = 0;
            if (subtotal <= 1000) shipping = 200;
            else if (subtotal <= 5000) shipping = 150;
            else shipping = 100;
        
            doc.moveDown();
            const summaryX = 350;
            const summaryStartY = doc.y;
            
            doc.rect(summaryX - 10, summaryStartY - 10, 220, 120).stroke();
            
            doc.font('Helvetica');
            doc.text('Subtotal:', summaryX, summaryStartY);
            doc.text(`₹${subtotal}`, 450, summaryStartY, { align: 'right' });
            
            doc.text('Shipping:', summaryX, summaryStartY + 25);
            doc.text(`₹${shipping}`, 450, summaryStartY + 25, { align: 'right' });
            
            if (order.discount) {
              doc.text('Discount:', summaryX, summaryStartY + 50);
              doc.text(`-₹${order.discount}`, 450, summaryStartY + 50, { align: 'right' });
            }
        
            doc.font('Helvetica-Bold');
            doc.text('Total:', summaryX, summaryStartY + 75);
            doc.text(
              `₹${subtotal + shipping - (order.discount || 0)}`,
              450,
              summaryStartY + 75,
              { align: 'right' }
            );
        
            doc.font('Helvetica')
              .fontSize(10)
              .text('Thank you for shopping with Tactics!', {
                align: 'center',
                y: doc.page.height - 100
              });
        
            doc.end();
        
          } catch (error) {
            console.error('Error generating PDF:', error);
            res.status(500).json({ 
              success: false, 
              message: 'Failed to generate PDF receipt' 
            });
          }
        },
        async retryPayment(req, res) {
          try {
            const { orderId } = req.params;
            
            const order = await Order.findOne({ _id: orderId })
              .populate('orderItems.productId');
            
            if (!order) {
              return res.status(404).json({
                success: false,
                message: 'Order not found'
              });
            }
        
            const amountInPaise = Math.round(order.totalAmount * 100); // Convert to paise
        
            console.log('Amount details:', {
              originalAmount: order.totalAmount,
              amountInPaise: amountInPaise
            });
        
            const razorpayOrder = await razorpay.orders.create({
              amount: amountInPaise,
              currency: 'INR',
              receipt: orderId.toString(),
              payment_capture: 1
            });
        
            const updatedOrder = await Order.findByIdAndUpdate(
              orderId,
              {
                razorpayOrderId: razorpayOrder.id
              },
              { new: true }
            );
        
            if (!updatedOrder) {
              throw new Error('Failed to update order with payment details');
            }
        
            const user = await User.findById(order.userId);
        
            res.json({
              success: true,
              razorpayKeyId: process.env.RAZORPAY_KEY_ID,
              razorpayOrderId: razorpayOrder.id,
              amount: amountInPaise,
              originalAmount: order.totalAmount,
              currency: 'INR',
              customerName: user.name,
              customerEmail: user.email,
              customerPhone: user.phone
            });
        
          } catch (error) {
            console.error('Retry payment error:', error);
            res.status(500).json({
              success: false,
              message: 'Failed to initialize payment',
              error: error.message
            });
          }
        },
        async verifyPayment(req, res) {
          try {
            const {
              orderId,
              razorpay_payment_id,
              razorpay_order_id,
              razorpay_signature
            } = req.body;
        
            const order = await Order.findById(orderId).populate('orderItems.productId');
            if (!order) {
              throw new Error('Order not found');
            }
        
            const amountInPaise = Math.round(order.totalAmount * 100);
        
            console.log('Order details:', {
              totalAmount: order.totalAmount,
              amountInPaise: amountInPaise
            });
        
            const body = razorpay_order_id + '|' + razorpay_payment_id;
            const expectedSignature = crypto
              .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
              .update(body.toString())
              .digest('hex');
        
            if (expectedSignature !== razorpay_signature) {
              throw new Error('Invalid signature');
            }
        
            const payment = await razorpay.payments.fetch(razorpay_payment_id);
        
            console.log('Payment verification details:', {
              expectedAmount: amountInPaise,
              paymentAmount: payment.amount,
              paymentStatus: payment.status
            });
        
            if (payment.amount !== amountInPaise) {
              throw new Error(
                `Payment amount mismatch. Expected: ${amountInPaise}, ` +
                `Got: ${payment.amount}`
              );
            }
        
            const updatedOrder = await Order.findByIdAndUpdate(
              orderId,
              {
                paymentStatus: 'Completed',
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature
              },
              { new: true }
            );
        
            if (!updatedOrder) {
              throw new Error('Failed to update order after payment verification');
            }
        
            res.json({
              success: true,
              message: 'Payment verified successfully'
            });
        
          } catch (error) {
            console.error('Payment verification error:', error);
            res.status(400).json({
              success: false,
              message: error.message || 'Payment verification failed'
            });
          }
        },
      
 
  
};

function formatAddress(addressObj) {
  if (!addressObj) return 'Address not available';
  return `${addressObj.house}, ${addressObj.street}, ${addressObj.city}, ${addressObj.state}, ${addressObj.pinCode}`;
}



module.exports = orderController;