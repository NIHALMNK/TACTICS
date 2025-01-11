const express = require("express");
const router = express.Router();
const dashboardController =require('../../controller/admin/dashboardController');


router.get('/dashboard',dashboardController .loadDashboard);


















module.exports = router;