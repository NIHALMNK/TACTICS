const express = require('express');
const router = express.Router();
const userController = require('../controller/user/userController');
const logController = require('../controller/user/logontroller');
const nocache = require('nocache');




// Registration routes
router.get('/register', logController.loadRegister);
router.post('/register/check-user', logController.checkUser);
router.post('/register/resendOtp', logController.resendOTP);
router.post('/register/verifyOtp', logController.verifyOTP);
router.get('/register/otp',logController.loadOTP);

// Login routes
router.get('/login',logController.loadLogin);
router.post('/checklogin',logController.checkLogin);

// Logout route
router.get('/logout', logController.logout);


//==================================================================>

// Protected route
router.get('/home',userController.loadHome);

//shop routes
// In your router file
router.get('/shop', userController.loadShop);
router.get('/shop/products', userController.loadShop);


// contacts routes

router.get('/contact', userController.loadContacts);

// about routes

router.get('/about', userController.loadAbout);

//loadProductDetails

router.get('/product-detail/:id', userController.getProductDetail);

//=========================================================================>

//account user section

//dashboard routes

router.get('/dashboard', userController.loadDashboard);

//orders routes
router.get('/order', userController.loadOrders);

// profile routes

router.get('/profile', userController.loadProfile);
router.put('/profile/update', userController.updateProfile);
router.put('/profile/change-password', userController.updatePassword);

// address routes
router.get('/address', userController.loadAddress);
router.post('/address/create', userController.createAddress);
router.put('/address/:addressId', userController.updateAddress);
router.delete('/address/:addressId', userController.removeAddress);
// wallet routes
router.get('/wallet', userController.loadWallet);















router.get('/auth/google',logController.GoogleLogin);
router.get('/auth/google/callback', logController.GoogleCallbacks);





module.exports = router;
