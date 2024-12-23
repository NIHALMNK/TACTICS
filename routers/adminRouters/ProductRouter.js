const express = require("express");
const router = express.Router();


const productController = require("../../controller/admin/productCondroller.js");
const upload = require("../../utils/productMulter.js");



//====product==================================================>

 // Product Management Routes
router.get("/productManagement", productController.loadProductManagement);
router.get("/productManagement/add", productController.loadAddProductsPage);
router.post("/productManagement/add",upload.fields([
        { name: "productImages1", maxCount: 1 },
        { name: "productImages2", maxCount: 1 },
        { name: "productImages3", maxCount: 1 },
        { name: "productImages4", maxCount: 1 },
    ]),productController.postAddProductsPage);

    router.get("/productManagement/update/:id", productController.loadUpdateProduct);
router.put("/productManagement/update/:id", upload.fields([
    { name: "productImages1", maxCount: 1 },
    { name: "productImages2", maxCount: 1 },
    { name: "productImages3", maxCount: 1 },
    { name: "productImages4", maxCount: 1 },
]), productController.postUpdateProduct);


    
    
    router.get('/productManagement/deleted', productController.loadDelProductPage);

    router.put('/productManagement/unlink', productController.deleteProduct);

    router.patch("/productManagement/recoverProducts/:id", productController.recoverProducts);

    router.delete("/productManagement/permanentDeleteProducts/:id", productController.permanentDeleteProducts);
    
    

    

module.exports = router;
