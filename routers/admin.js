const express = require("express");
const router = express.Router();
////////////////////////////////////////////////////////////////////=>\
// Importing the controller

const adminController = require("../controller/admin/adminController.js");
const categoryController = require("../controller/admin/categoryController.js");
const productController = require("../controller/admin/productCondroller.js");
const userController = require('../controller/admin/userAdminController.js')
const upload = require("../utils/productMulter.js");
const upload_2 = require("../utils/categoryMulter.js");

//====================Admin Controller================>
// Admin authentication routes
router.get('/login', adminController.loadLogin)
router.post('/login', adminController.loginForm)
router.get('/logout', adminController.logout);
// Admin dashboard routes
router.get('/dashboard', adminController.loadDashboard)
//====category==================================================>
router.get("/category", categoryController.loadCategoryManagement);
router.get("/category/update/:id", categoryController.loadUpdateCategory);
router.put("/category/update", upload_2.single("categoryImage"), categoryController.updateCategory);
router.get("/category/add", categoryController.loadAddCategoryPage);
router.post("/category/add", upload_2.single("categoryImage"), categoryController.postAddCategoryPage);
router.get('/category/del', categoryController.loadDelCategoryPage);
router.put('/category/unlink', categoryController.deleteCategory);
// router.patch("/category/recoverCategory/:id", categoryController.recoverCategory);
// router.delete("/category/permanentDeleteCategory/:id", categoryController.permanentDeleteCategory);
router.patch("/category/recoverCategory/:id", (req, res, next) => {
  console.log("Recover category request received for ID:", req.params.id);
  next();
}, categoryController.recoverCategory);

router.delete("/category/permanentDeleteCategory/:id", (req, res, next) => {
  console.log("Permanent delete request received for ID:", req.params.id);
  next();
}, categoryController.permanentDeleteCategory);




//====product==================================================>

router.get("/productManagement", productController.loadProductManagement);
router.get("/productManagement/add", productController.loadAddProductsPage);
router.post(
  "/productManagement/add",
  upload.fields([
    { name: "productImage1", maxCount: 1 },
    { name: "productImage2", maxCount: 1 },
    { name: "productImage3", maxCount: 1 },
    { name: "productImage4", maxCount: 1 },
  ]),
  productController.postAddProductsPage
);

router.get("/productManagement/update/:id", productController.loadUpdateProduct);

router.put("/productManagement/update/:id",
  upload.fields([
    { name: "productImage0", maxCount: 1 },
    { name: "productImage1", maxCount: 1 },
    { name: "productImage2", maxCount: 1 },
    { name: "productImage3", maxCount: 1 },
  ]),
  productController.updateProduct
);

router.get('/productManagement/deleted', productController.loadDelProductPage);
router.put('/productManagement/unlink', productController.deleteProduct);
router.patch("/productManagement/recoverProducts/:id", productController.recoverProducts);
router.delete("/productManagement/permanentDeleteProducts/:id", productController.permanentDeleteProducts);


//===========user==============================================>
// User management routes
router.put('/userManagement/ban', userController.userBan);
router.get('/userManagement/view', userController.viewUserDetails);
router.get('/userManagement', userController.loadUserManagementPage);
router.get('/api/userManagement', userController.getUsersAsJson);




module.exports = router;
