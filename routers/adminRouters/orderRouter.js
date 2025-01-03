const express = require("express");
const router = express.Router();

const orderController=require('../../controller/admin/orderManegementControll')


// Order management routes
router.get('/orders', orderController.loadOrder)
router.get('/orders/:id', orderController.getOrderDetails)
router.put('/orders/status', orderController.updateOrderStatus)
router.put('/orders/payment-status', orderController.updatePaymentStatus)
router.post('/orders/return', orderController.handleReturnRequest)
router.get('/orders/search', orderController.searchOrders)



module.exports = router;
