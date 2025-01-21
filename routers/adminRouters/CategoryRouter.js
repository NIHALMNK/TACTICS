const express = require("express");
const router = express.Router();
const adminAuth=require('../../middleware/adminauth.js')
//---------------------------------->

router.use("/category", adminAuth);

const categoryController = require("../../controller/admin/categoryController.js");
const upload_2 = require("../../utils/categoryMulter.js");




//====category==================================================>

router.get("/category", categoryController.loadCategoryManagement);

router.get("/category/update/:id", categoryController.loadUpdateCategory);

router.put("/category/update", upload_2.single("categoryImage"), categoryController.updateCategory);

router.get("/category/add", categoryController.loadAddCategoryPage);

router.post("/category/add", upload_2.single("categoryImage"), categoryController.postAddCategoryPage);

router.get('/category/del', categoryController.loadDelCategoryPage);

router.put('/category/unlink', categoryController.deleteCategory);

router.patch("/category/recoverCategory/:id", (req, res, next) => {
    // console.log("Recover category request received for ID:", req.params.id);
    next();
}, categoryController.recoverCategory);

router.delete("/category/permanentDeleteCategory/:id", (req, res, next) => {
    // console.log("Permanent delete request received for ID:", req.params.id);
    next();
}, categoryController.permanentDeleteCategory);


router.put("/category/add-offer", categoryController.addCategoryOffer);
router.put("/category/remove-offer", categoryController.removeOffer);



module.exports = router;

