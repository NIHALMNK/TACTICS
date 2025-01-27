const express = require("express");
const router = express.Router();

const orderController=require('../../controller/admin/orderManegementControll')
const adminAuth=require('../../middleware/adminauth.js')

router.use("/orders", adminAuth);

// Order management routes
router.get('/orders', orderController.loadOrder)
router.get('/orders/:id', orderController.getOrderDetails)
router.put('/orders/status', orderController.updateOrderStatus)
router.put('/orders/payment-status', orderController.updatePaymentStatus)
router.put('/orders/return-request', orderController.handleReturnRequest)
router.get('/orders/search', orderController.searchOrders)
router.put('/orders/handleIndividualReturn', orderController.handleIndividualReturn);


module.exports = router;
