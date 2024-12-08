const User = require("../../models/userRegister");

const productModel = require("../../models/productModel");
const categoryModel = require("../../models/categoryModel");

module.exports = {
  

  // Load home page
  async loadHome(req, res) {
    try {
      const products = await productModel
        .find({ isDeleted: false })
        .populate("category");
      res.render("user/home", { user: req.session.user, products });
    } catch (error) {
      console.error("Error loading home page:", error);
      res.status(500).send("Server Error");
    }
  },

  // async loadShop(req, res) {
  //   try {
      
  //     const categoryName = req.query.category;

  //     let products;

  //     if (categoryName) {
        
  //       const category = await categoryModel.findOne({
  //         name: categoryName,
  //         isDeleted: false,
  //       });

  //       if (!category) {
  //         return res.status(404).send("Category not found");
  //       }

  //       products = await productModel
  //         .find({ category: category._id, isDeleted: false })
  //         .populate("category");
  //     } else {
        
  //       products = await productModel
  //         .find({ isDeleted: false })
  //         .populate("category");
  //     }

      
  //     res.render("user/shop", { user: req.session.user, products });
  //   } catch (error) {
  //     console.error("Error loading shop:", error);
  //     res.status(500).send("Server Error");
  //   }
  // },

 
  //load contacts

// In your userController
async loadShop(req, res) {
  try {
    const categoryName = req.query.category;
    const page = parseInt(req.query.page) || 1;
    const limit = 8;
    const skip = (page - 1) * limit;

    let query = { isDeleted: false };
    
    if (categoryName) {
      const category = await categoryModel.findOne({
        name: categoryName,
        isDeleted: false,
      });

      if (!category) {
        return res.status(404).send("Category not found");
      }

      query.category = category._id;
    }

    // Find total number of products
    const totalProducts = await productModel.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);

    // Fetch paginated products
    const products = await productModel
      .find(query)
      .populate("category")
      .skip(skip)
      .limit(limit);

    // For the first page, render the full shop page
    if (page === 1) {
      return res.render("user/shop", { 
        user: req.session.user, 
        products,
        currentPage: page,
        totalPages,
        categoryName: categoryName || 'All Products'
      });
    }

    // For subsequent pages, return JSON
    res.json({
      products,
      currentPage: page,
      totalPages,
      categoryName: categoryName || 'All Products'
    });

  } catch (error) {
    console.error("Error loading shop:", error);
    res.status(500).send("Server Error");
  }
},

  async loadContacts(req, res) {
    try {
      res.render("user/contact", { user: req.session.user });
    } catch (error) {
      console.error("Error loading contacts:", error);
      res.status(500).send("Server Error");
    }
  },

  //load About

  async loadAbout(req, res) {
    try {
      res.render("user/about", { user: req.session.user });
    } catch (error) {
      console.error("Error loading about:", error);
      res.status(500).send("Server Error");
    }
  },

  //loadProductDetails

  async getProductDetail(req, res) {
    try {
     
      const productId = req.params.id;

      
      const product = await productModel
        .findById(productId)
        .populate("category");
      if (!product) {
        return res.status(404).send("Product not found");
      }

     
      const productAll = await productModel.find({ isDeleted: false });
      const relatedProducts = await productModel.find({
        tags: { $in: product.tags },
        _id: { $ne: product._id },
      });

      return res.status(200).render("user/productdetail", {
        product,
        user: req.session.user,
        productAll,
        relatedProducts,
      });
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).send("Server error");
    }
  },



  //====================================================>
 // Load user profile
  async loadDashboard(req, res) {
    try {
      res.render("user/dashboard", { user: req.session.user });
    } catch (error) {
      console.error("Error loading dashboard:", error);
      res.status(500).send("Server Error");
    }
  },

    // Load order profile
    async loadOrders(req, res) {
      try {
        res.render("user/order", { user: req.session.user });
      } catch (error) {
        console.error("Error loading order:", error);
        res.status(500).send("Server Error");
      }
    },
  


    //load Profile
    async loadProfile(req, res) {
      try {
        res.render("user/profile", { user: req.session.user });
      } catch (error) {
        console.error("Error loading profile:", error);
        res.status(500).send("Server Error");
  }
    },

    //load Address
    async loadAddress(req, res) {
      try {
        res.render("user/address", { user: req.session.user });
      } catch (error) {
        console.error("Error loading address:", error);
        res.status(500).send("Server Error");
      }
    },

    //load change password
    async loadChangePassword(req, res) {
      try {
        res.render("user/changepassword", { user: req.session.user });
      } catch (error) {
        console.error("Error loading change password:", error);
        res.status(500).send("Server Error");
      }
    },

    // load Wallet
    async loadWallet(req, res) {
      try {
        res.render("user/wallet", { user: req.session.user });
      } catch (error) {
        console.error("Error loading wallet:", error);
        res.status(500).send("Server Error");
      }
    },
    


  //end{code}



};
