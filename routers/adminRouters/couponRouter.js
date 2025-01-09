const express = require("express");
const router = express.Router();
const couponController=require('../../controller/admin/couponController')


router.get('/couponManagement',couponController.loadcoupon)
router.get('/couponManagement/add',couponController.loadAddCoupon)
router.post('/couponManagement/add',couponController.addCoupon)




router.get('/couponManagement/update/:id',couponController.loadUpdate)
router.put('/couponManagement/update/:id',couponController.updateCoupon)




module.exports = router;
