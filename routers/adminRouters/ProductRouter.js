const express = require("express");
const router = express.Router();


const productController = require("../../controller/admin/productCondroller.js");
const upload = require("../../utils/productMulter.js");



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
    
    

    

module.exports = router;
