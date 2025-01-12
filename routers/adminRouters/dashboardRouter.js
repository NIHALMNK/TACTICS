const express = require("express");
const router = express.Router();
const dashboardController = require('../../controller/admin/dashboardController');

// Dashboard routes
router.get('/dashboard', dashboardController.loadDashboard);

// Sales report routes
router.get('/sales-report', dashboardController.getSalesReport);
router.get('/sales-report/download', dashboardController.downloadSalesReport);

module.exports = router;