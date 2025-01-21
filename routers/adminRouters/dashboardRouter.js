const express = require("express");
const router = express.Router();
const dashboardController = require('../../controller/admin/dashboardController');
const adminAuth=require('../../middleware/adminauth.js')

router.use("/dashboard", adminAuth);
router.use("/sales-report", adminAuth);

// Dashboard routes
router.get('/dashboard', dashboardController.loadDashboard);

// Sales report routes
router.get('/sales-report', dashboardController.getSalesReport);
router.get('/sales-report/download', dashboardController.downloadSalesReport);

module.exports = router;