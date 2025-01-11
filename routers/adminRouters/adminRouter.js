const express = require("express");
const router = express.Router();
////////////////////////////////////////////////////////////////////=>\
// Importing the controller

const adminController = require("../../controller/admin/adminController.js");

//====================Admin Controller================>
// Admin authentication routes
router.get('/login', adminController.loadLogin)
router.post('/login', adminController.loginForm)
router.get('/logout', adminController.logout);





module.exports = router;