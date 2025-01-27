const Order = require('../../models/orderModel');
const User = require('../../models/userRegister');
const Product = require('../../models/productModel');
const wallet = require('../../models/walletModel');
const Cart = require('../../models/CartModel')
const PDFDocument = require('pdfkit');
const fs = require('fs');
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { log } = require('console');
const path = require('path')


const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const orderController = {

  async loadOrders(req, res) {
    try {
      const userId = req.session.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = 5;
      const skip = (page - 1) * limit;


      const totalOrders = await Order.countDocuments({ userId });
      const totalPages = Math.ceil(totalOrders / limit);


      const orders = await Order.find({ userId })
        .populate('orderItems.productId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

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

        const productDiscount = totals.mrp - totals.subtotal;
        const couponDiscount = order.couponDiscount || 0;
        const totalDiscount = productDiscount + couponDiscount;
        const total = order.totalAmount;

        return {
          id: order._id,
          orderId: order.orderId,
          orderDate: order.createdAt,
          items: order.orderItems.map(item => ({
            name: item.productId.name,
            quantity: item.quantity,
            status:item.status,
            size: item.size,
            price: item.productId.offerPrice,
            mrp: item.productId.price,
            total: item.productId.offerPrice * item.quantity,
            mrpTotal: item.productId.price * item.quantity,
            discount: (item.productId.price - item.productId.offerPrice) * item,
            _id: item._id,
            productId: item.productId
          })),
          mrp: totals.mrp,
          subtotal: totals.subtotal,
          shipping: shipping,
          productDiscount: productDiscount,
          couponDiscount: couponDiscount,
          totalDiscount: totalDiscount,
          total: total,
          status: order.status,
          shippingAddress: order.shippingAddress,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus
        };
      });


      res.render('user/order', {
        orders: formattedOrders,
        user: req.session.user.id,
        currentPage: page,
        totalPages: totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      });
    } catch (error) {
      console.error('Error loading orders:', error);
      res.status(500).render('error', {
        message: 'Failed to load orders',
        error: process.env.NODE_ENV === 'development' ? error : {}
      });
    }
  },

  async getOrderDetails(req, res) {
    try {
      console.log("--->>>getOrderDetails");

      const orderId = req.params.orderId;
      const userId = req.session.user.id;
      const addressId = req.params.addressId || req.body.addressId;

      console.log("Order ID:", orderId); // Log orderId to verify

      const order = await Order.findOne({ orderId }).populate('orderItems.productId');

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
          _id: order._id,
          orderId: order.orderId,
          date: order.createdAt,
          status: order.status,
          items: order.orderItems.map(item => ({
            status: item.status,
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

  async requestReturn(req, res) {
    try {
      console.log("--->>>requestReturn");

      const { reason, orderId } = req.body;


      console.log(orderId);

      const userId = req.session.user.id;

      const order = await Order.findOne({ orderId });

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
      console.log("--->>>cancelOrder");

      const userId = req.session.user.id;
      const orderId = req.params.orderId;
      const { reason } = req.body;



      console.log(reason);

      const order = await Order.findOne({ orderId: orderId }).populate('orderItems.productId');

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
        });
      }
      console.log(userId);
      console.log(order);
      console.log("--->" + order.userId);



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
      order.cancelReason = reason;
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
  
      const order = await Order.findOne({ orderId, userId }).populate('orderItems.productId');
  
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
  
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
        bufferPages: true
      });
  
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=order-${orderId}-receipt.pdf`);
      doc.pipe(res);
  
      // Color Palette
      const colors = {
        primary: '#2C3E50',
        secondary: '#3498DB',
        background: '#F4F6F7',
        text: '#2C3E50'
      };
  
      // Currency Formatter
      const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(amount);
      };
  
      // Dynamic Logo Path with Fallback
      const logoPaths = [
        path.join(__dirname, '..', 'public', 'images', 'logos', 'black-logo.png'),
        path.join(__dirname, '..', 'public', 'images', 'logos', 'black-logo.jpg'),
        path.join(__dirname, '..', 'public', 'images', 'tactics-logo.png')
      ];
  
      const logoPath = logoPaths.find(fs.existsSync);
  
      if (logoPath) {
        doc.image(logoPath, 50, 40, { width: 80, align: 'left' });
      }
  
      doc.fillColor(colors.primary)
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('TACTICS', 150, 50, { align: 'left', characterSpacing: 0.5 })
        .fontSize(12)
        .fillColor(colors.secondary)
        .text('Official Order Receipt', 150, 80, { align: 'left', characterSpacing: 0 });
  
      // Decorative Line
      doc.strokeColor(colors.secondary)
        .lineWidth(1.5)
        .moveTo(50, 110)
        .lineTo(550, 110)
        .stroke();
  
      // Order Information
      doc.fillColor(colors.text)
        .fontSize(10)
        .font('Helvetica')
        .text(`Order ID: #${orderId}`, 50, 130)
        .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 50, 145)
        .text(`Status: ${order.status}`, 50, 160);
  
      // Shipping Address
      doc.font('Helvetica-Bold')
        .text('Shipping Address', 350, 130, { align: 'left' })
        .font('Helvetica')
        .text(`${order.shippingAddress.house}`, 350, 150)
        .text(`${order.shippingAddress.street}`, 350, 165)
        .text(`${order.shippingAddress.city}, ${order.shippingAddress.state}`, 350, 180)
        .text(`PIN: ${order.shippingAddress.pinCode}`, 350, 195);
  
      // Table Setup
      const tableTop = 230;
      const tableOptions = {
        headerBackground: colors.secondary,
        headerColor: 'white',
        alternateRowBackground: colors.background
      };
  
      // Table Header
      doc.fillColor(tableOptions.headerBackground)
        .rect(50, tableTop, 500, 30)
        .fill();
  
      doc.fillColor(tableOptions.headerColor)
        .font('Helvetica-Bold')
        .fontSize(12);
  
      const headers = ['Item', 'Size', 'Qty', 'Price', 'Total'];
      const positions = [60, 250, 330, 410, 490];
  
      headers.forEach((header, index) => {
        doc.text(header, positions[index], tableTop + 8, {
          align: index === 0 ? 'left' : 'center'
        });
      });
  
      // Table Rows
      let rowY = tableTop + 40;
      const activeItems = order.orderItems.filter(item => 
        item.status !== 'Cancelled' && item.status !== 'Returned'
      );
  
      activeItems.forEach((item, index) => {
        if (index % 2 !== 0) {
          doc.fillColor(tableOptions.alternateRowBackground)
            .rect(50, rowY - 5, 500, 25)
            .fill();
        }
  
        const itemPrice = item.price || item.productId.offerPrice;
        const itemTotal = itemPrice * item.quantity;
  
        doc.fillColor(colors.text)
          .font('Helvetica')
          .text(item.productId.name, 60, rowY, { width: 180 })
          .text(item.size, 250, rowY, { align: 'center', width: 70 })
          .text(item.quantity.toString(), 330, rowY, { align: 'center', width: 70 })
          .text(formatCurrency(itemPrice), 410, rowY, { align: 'center', width: 70 })
          .text(formatCurrency(itemTotal), 490, rowY, { align: 'center', width: 70 });
  
        rowY += 25;
      });
  
      // Use order's stored values instead of recalculating
      const summaryEntries = [
        { label: 'MRP Total:', value: formatCurrency(order.mrp) },
        { label: 'Subtotal:', value: formatCurrency(order.subtotal) },
        { label: 'Shipping:', value: formatCurrency(order.shipping) }
      ];
  
      // Add discount entries if they exist
      if (order.discount > 0) {
        summaryEntries.push({ label: 'Product Discount:', value: `-${formatCurrency(order.discount)}` });
      }
  
      if (order.couponDiscount > 0) {
        summaryEntries.push({ label: 'Coupon Discount:', value: `-${formatCurrency(order.couponDiscount)}` });
      }
  
      if (order.returnAmount > 0) {
        summaryEntries.push({ label: 'Returns:', value: `-${formatCurrency(order.returnAmount)}` });
      }
  
      // Add final total
      summaryEntries.push({ 
        label: 'Total:', 
        value: formatCurrency(order.totalAmount), 
        bold: true 
      });
  
      // Summary Box
      doc.strokeColor(colors.secondary)
        .lineWidth(1)
        .rect(350, rowY + 20, 200, summaryEntries.length * 25 + 20)
        .stroke();
  
      summaryEntries.forEach((entry, index) => {
        doc.fillColor(colors.text)
          .font(entry.bold ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(12)
          .text(entry.label, 360, rowY + 35 + (index * 20), { continued: true, align: 'left' })
          .text(entry.value, { align: 'right', characterSpacing: 0 });
      });
  
      // Footer
      doc.fillColor(colors.secondary)
        .fontSize(10)
        .text('Thank you for shopping with Tactics!', {
          align: 'center',
          y: doc.page.height - 50,
          characterSpacing: 0
        });
  
      doc.end();
    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate PDF receipt',
        errorDetails: error.message
      });
    }
  },

  async retryPayment(req, res) {
    try {
      console.log("--->>>retryPayment");

      const { orderId } = req.params;

      console.log(orderId);

      const order = await Order.findOne({ orderId: orderId })
        .populate('orderItems.productId');

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      const amountInPaise = Math.round(order.totalAmount * 100);

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

      const updatedOrder = await Order.findOneAndUpdate(
        { orderId },
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
      console.log("--->>>verifyPayment");

      const {
        orderId,
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature
      } = req.body;

      const order = await Order.findOne({ orderId }).populate('orderItems.productId');
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

      const cart = await Cart.findOne({ userId: order.userId });

      if (cart && cart.items.length > 0) {
        // Get all product IDs and sizes from the order
        const orderProducts = order.orderItems.map(item => ({
          productId: item.productId._id.toString(),
          size: item.size
        }));

        // Filter out the ordered products from cart
        cart.items = cart.items.filter(cartItem => {
          return !orderProducts.some(orderProduct =>
            orderProduct.productId === cartItem.productId.toString() &&
            orderProduct.size === cartItem.size
          );
        });

        await cart.save();
      }

      const updatedOrder = await Order.findOneAndUpdate(
        { orderId },
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

  async cancelSpecificItem(req, res) {
    try {
      const { orderItemId, orderId, reason } = req.body;
      const userId = req.session.user.id;

      const order = await Order.findOne({ orderId }).populate('orderItems.productId');

      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      if (order.userId.toString() !== userId) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      const itemToCancel = order.orderItems.id(orderItemId);

      if (!itemToCancel) {
        return res.status(404).json({ success: false, message: 'Item not found in order' });
      }

      // Modified status check to allow cancellation of paid orders
      if (itemToCancel.status !== 'Pending' && itemToCancel.status !== 'Completed') {
        return res.status(400).json({ 
          success: false, 
          message: 'Only items in pending or completed orders can be cancelled' 
        });
      }

      // Handle wallet refund if payment was completed
      if (order.paymentStatus === 'Completed') {
        const itemRefundAmount = itemToCancel.price * itemToCancel.quantity;
        const referenceId = `CANCEL-${orderId}-${orderItemId}`;

        let walletData = await wallet.findOne({ userId });
        if (!walletData) {
          walletData = await wallet.create({
            userId,
            balance: itemRefundAmount,
            transactionHistory: [{
              transactionType: "CREDIT",
              transactionAmount: itemRefundAmount,
              reference: referenceId,
              description: `Refund for cancelled item in order #${orderId}`
            }]
          });
        } else {
          walletData.balance += itemRefundAmount;
          walletData.transactionHistory.push({
            transactionType: "CREDIT",
            transactionAmount: itemRefundAmount,
            reference: referenceId,
            transactionDate: new Date(),
            description: `Refund for cancelled item in order #${orderId}`
          });
          await walletData.save();
        }
      }

      const product = itemToCancel.productId;
      const stockEntry = product.stockManagement.find(stock => stock.size === itemToCancel.size);

      if (stockEntry) {
        stockEntry.quantity += itemToCancel.quantity;
        await product.save();
      }

      itemToCancel.status = 'Cancelled';
      itemToCancel.cancelReason = reason;

      const remainingItems = order.orderItems.filter(item => item.status !== 'Cancelled');

      if (remainingItems.length === 0) {
        order.status = 'Cancelled';
        order.cancelReason = reason;
      } else {
        const totals = remainingItems.reduce((acc, item) => {
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

        order.mrp = totals.mrp;
        order.subtotal = totals.subtotal;
        order.shipping = shipping;
        order.discount = totals.mrp - totals.subtotal;
        order.totalDiscount = order.discount + (order.couponDiscount || 0);
        order.totalAmount = totals.subtotal + shipping;
      }

      await order.save();

      for (const item of order.orderItems) {
        const product = await Product.findById(item.productId);
        if (product) {
          product.quantity += item.quantity;
          await product.save();
        } else {
          return res.status(400).json({
            success: false,
            message: 'Item cancellation failed'
          });
        }
      }

      res.status(200).json({
        success: true,
        message: 'Item cancelled successfully',
        order: order
      });
    } catch (error) {
      console.error('Cancel specific item error:', error);
      res.status(500).json({ success: false, message: 'Server error during item cancellation' });
    }
  },

  async returnSpecificItem(req, res) {
    try {
      const { orderItemId, orderId, reason } = req.body;
      const userId = req.session.user.id;
  
      const order = await Order.findOne({ orderId }).populate('orderItems.productId');
  
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
  
      // Verify user ownership
      if (order.userId.toString() !== userId) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }
  
      const itemToReturn = order.orderItems.id(orderItemId);
  
      if (!itemToReturn) {
        return res.status(404).json({ success: false, message: 'Item not found in order' });
      }
  
      if (order.status !== 'Completed') {
        return res.status(400).json({ success: false, message: 'Only items in completed orders can be returned' });
      }
  
      const itemRefundAmount = itemToReturn.price * itemToReturn.quantity;
  
      const product = itemToReturn.productId;
      const stockEntry = product.stockManagement.find(stock => stock.size === itemToReturn.size);
  
      if (stockEntry) {
        stockEntry.quantity += itemToReturn.quantity;
        await product.save();
      }
  
      itemToReturn.status = 'Requested';
      itemToReturn.refundReason = reason;
  
      // Calculate totals excluding returned items
      const remainingItems = order.orderItems.filter(item => 
        item.status !== 'Returned' && item.status !== 'Requested'
      );
  
      if (remainingItems.length === 0) {
        order.status = 'Requested';
        order.refundReason = reason;
        // Set all amounts to 0 if no items remain
        order.mrp = 0;
        order.subtotal = 0;
        order.shipping = 0;
        order.discount = 0;
        order.totalAmount = 0;
      } else {
        const totals = remainingItems.reduce((acc, item) => {
          const mrpTotal = item.productId.price * item.quantity;
          const offerTotal = item.productId.offerPrice * item.quantity;
  
          acc.mrp += mrpTotal;
          acc.subtotal += offerTotal;
          return acc;
        }, { mrp: 0, subtotal: 0 });
  
        // Calculate shipping based on remaining subtotal
        let shipping = 0;
        if (totals.subtotal > 0 && totals.subtotal <= 1000) {
          shipping = 200;
        } else if (totals.subtotal > 1000 && totals.subtotal <= 5000) {
          shipping = 150;
        } else if (totals.subtotal > 5000) {
          shipping = 100;
        }
  
        // Update order totals
        order.mrp = totals.mrp;
        order.subtotal = totals.subtotal;
        order.shipping = shipping;
        order.discount = totals.mrp - totals.subtotal;
        order.totalDiscount = order.discount + (order.couponDiscount || 0);
        order.totalAmount = totals.subtotal + shipping;
        
        // Store return amount for reference
        order.returnAmount = (order.returnAmount || 0) + itemRefundAmount;
      }
  
      await order.save();
  
      // Update product quantities
      for (const item of order.orderItems) {
        const product = await Product.findById(item.productId);
        if (product) {
          product.quantity += item.quantity;
          await product.save();
        } else {
          return res.status(400).json({
            success: false,
            message: 'Item return failed - product not found'
          });
        }
      }
  
      res.status(200).json({
        success: true,
        message: 'Item returned successfully',
        order: order
      });
    } catch (error) {
      console.error('Return specific item error:', error);
      res.status(500).json({ success: false, message: 'Server error during item return' });
    }
  },


};

function formatAddress(addressObj) {
  if (!addressObj) return 'Address not available';
  return `${addressObj.house}, ${addressObj.street}, ${addressObj.city}, ${addressObj.state}, ${addressObj.pinCode}`;
}



module.exports = orderController;