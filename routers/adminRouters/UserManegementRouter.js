const express = require("express");
const router = express.Router();


const userController = require('../../controller/admin/userAdminController.js')
const adminAuth=require('../../middleware/adminauth.js')
router.use("/userManagement", adminAuth);
router.use("/api", adminAuth);




// User management routes
router.put('/userManagement/ban', userController.userBan);

router.get('/userManagement/view', userController.viewUserDetails);

router.get('/userManagement', userController.loadUserManagementPage);

router.get('/api/userManagement', userController.getUsersAsJson);



module.exports = router;
