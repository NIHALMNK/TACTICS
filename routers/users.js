const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');
const nocache = require('nocache');




// Registration routes
router.get('/register', userController.loadRegister);
router.post('/register/check-user', userController.checkUser);
router.post('/register/resendOtp', userController.resendOTP);
router.post('/register/verifyOtp', userController.verifyOTP);
router.get('/register/otp',userController.loadOTP);

// Login routes
router.get('/login',userController.loadLogin);
router.post('/checklogin',userController.checkLogin);

// Protected route
router.get('/home',userController.loadHome);

//shop routes
router.get('/shop', userController.loadShop);

//dashboard routes

router.get('/dashboard', userController.loadDashboard);

// contacts routes

router.get('/contact', userController.loadContacts);

// about routes

router.get('/about', userController.loadAbout);

//loadProductDetails

router.get('/product-detail/:id', userController.getProductDetail);

// Logout route
router.get('/logout', userController.logout);

router.get('/auth/google',userController.GoogleLogin);
router.get('/auth/google/callback', userController.GoogleCallbacks);





module.exports = router;
