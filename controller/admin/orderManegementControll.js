const order = require('../../models/orderModel')
// const user = require('../../models/userRegister')
const product = require('../../models/productModel')

module.exports = {
    
    async loadOrder(req, res) {
        try {
            const page = parseInt(req.query.page) || 1
            const limit = 8 // Items per page
            const skip = (page - 1) * limit

            // Get total count for pagination
            const totalOrders = await order.countDocuments()
            const totalPages = Math.ceil(totalOrders / limit)

            // Fetch orders with pagination and populate necessary fields
            const orders = await order.find()
                .populate('userId', 'name email') // Only get name and email from user
                .populate({
                    path: 'orderItems.productId',
                    select: 'name price images' // Select specific fields from product
                })
                .sort({ createdAt: -1 }) // Sort by newest first
                .skip(skip)
                .limit(limit)

            res.render('admin/orderManagement', {
                orders,
                currentPage: page,
                totalPages,
                totalOrders
            })
        } catch (error) {
            console.error('Error in loadOrder:', error)
            res.status(500).render('admin/error', {
                message: 'Error loading orders'
            })
        }
    },

    // Get single order details for modal
    async getOrderDetails(req, res) {
        try {
            const orderId = req.params.id
            const orderDetails = await order.findById(orderId)
                .populate('userId', 'name email')
                .populate({
                    path: 'orderItems.productId',
                    select: 'name price images'
                })

            if (!orderDetails) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                })
            }

            res.json({
                success: true,
                order: orderDetails
            })
        } catch (error) {
            console.error('Error in getOrderDetails:', error)
            res.status(500).json({
                success: false,
                message: 'Error fetching order details'
            })
        }
    },

    // Update order status
    async updateOrderStatus(req, res) {
        try {
            const { orderId, status } = req.body
            const validStatuses = ['Pending', 'Cancelled', 'Shipping', 'Completed', 'Returned', 'Requested', 'Rejected']

            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid status'
                })
            }

            const updatedOrder = await order.findByIdAndUpdate(
                orderId,
                { status },
                { new: true }
            )

            if (!updatedOrder) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                })
            }

            res.json({
                success: true,
                order: updatedOrder,
                message: 'Order status updated successfully'
            })
        } catch (error) {
            console.error('Error in updateOrderStatus:', error)
            res.status(500).json({
                success: false,
                message: 'Error updating order status'
            })
        }
    },

    // Update payment status
    async updatePaymentStatus(req, res) {
        try {
            const { orderId, paymentStatus } = req.body
            const validPaymentStatuses = ['Pending', 'Completed', 'Failed']

            if (!validPaymentStatuses.includes(paymentStatus)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid payment status'
                })
            }

            const updatedOrder = await order.findByIdAndUpdate(
                orderId,
                { paymentStatus },
                { new: true }
            )

            if (!updatedOrder) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                })
            }

            res.json({
                success: true,
                order: updatedOrder,
                message: 'Payment status updated successfully'
            })
        } catch (error) {
            console.error('Error in updatePaymentStatus:', error)
            res.status(500).json({
                success: false,
                message: 'Error updating payment status'
            })
        }
    },

    // Handle order return requests
    async handleReturnRequest(req, res) {
        try {
            const { orderId, action, refundReason } = req.body

            if (!['approve', 'reject'].includes(action)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid action'
                })
            }

            const orderToUpdate = await order.findById(orderId)

            if (!orderToUpdate) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                })
            }

            // Update order based on action
            const status = action === 'approve' ? 'Returned' : 'Rejected'
            orderToUpdate.status = status
            if (refundReason) {
                orderToUpdate.refundReason = refundReason
            }

            await orderToUpdate.save()

            res.json({
                success: true,
                message: `Return request ${action}ed successfully`
            })
        } catch (error) {
            console.error('Error in handleReturnRequest:', error)
            res.status(500).json({
                success: false,
                message: 'Error processing return request'
            })
        }
    },

    // Search orders
    async searchOrders(req, res) {
        try {
            const { query } = req.query
            const searchRegex = new RegExp(query, 'i')

            const orders = await order.find({
                $or: [
                    { '_id': { $regex: searchRegex } },
                    { 'status': { $regex: searchRegex } },
                    { 'paymentMethod': { $regex: searchRegex } }
                ]
            })
            .populate('userId', 'name email')
            .populate({
                path: 'orderItems.productId',
                select: 'name price images'
            })
            .sort({ createdAt: -1 })

            res.json({
                success: true,
                orders
            })
        } catch (error) {
            console.error('Error in searchOrders:', error)
            res.status(500).json({
                success: false,
                message: 'Error searching orders'
            })
        }
    }
};