

const User = require("../../models/userRegister");
const productModel = require("../../models/productModel");
const categoryModel = require("../../models/categoryModel");
const bcrypt = require('bcrypt');

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


  //load contacts

  // In your userController
  async loadShop(req, res) {
    try {
      const categoryName = req.query.category;
      const page = parseInt(req.query.page) || 1;
      const limit = 8;
      const skip = (page - 1) * limit;

      let query = { isDeleted: false };

      // Fetch all categories
      const categories = await categoryModel.find({ isDeleted: false });

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

      // Render the shop page
      if (page === 1) {
        return res.render("user/shop", {
          user: req.session.user,
          products,
          currentPage: page,
          totalPages,
          categories, // Pass categories array here
          selectedCategory: categoryName || 'All Products', // Pass selected category name
        });
      }

      // For subsequent pages, return JSON
      res.json({
        products,
        currentPage: page,
        totalPages,
        categories,
        selectedCategory: categoryName || 'All Products'
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
        .populate("category")
        .exec();

      if (!product || product.isDeleted) {
        // console.log("Product not found, deleted, or has no category");
        return res.redirect('/home');
      }

      // console.log("HEI"+product)


      const productAll = await productModel.find({ isDeleted: false });
      const relatedProducts = await productModel.find({
        brand: { $in: product.brand },
        _id: { $ne: product._id },
        isDeleted: false,

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

  //====================================================>

  //load Profile
  async loadProfile(req, res) {
    try {
      const user = await User.findById(req.session.user.id);
      res.render("user/profile", { user});
    } catch (error) {
      console.error("Error loading profile:", error.message);
      res.status(500).send("Server Error");
    }
  },

  async updateProfile(req, res) {
    try {
      const { name, phone } = req.body;
      const userId = req.session.user.id;
  
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Update name if provided
      if (name) {
        user.name = name;
      }
  
      // Update phone if provided
      if (phone !== undefined) {
        user.phone = phone;
      }
  
      await user.save();
  
      // Update session user information
      req.session.user = {
        ...req.session.user,
        name: user.name,
        phone: user.phone
      };
  
      return res.status(200).json({
        message: "Profile updated successfully",
        user: { name: user.name, email: user.email, phone: user.phone }
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
  async updatePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.session.user.id;
  
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
  
      // Hash new password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
  
      await user.save();
  
      return res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error updating password:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
  //====================================================>

  // Load Address Page
  async loadAddress(req, res) {
    try {
      const userId = req.session.user.id;

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).send("User not found");
      }

      // Pagination for addresses
      const page = parseInt(req.query.page) || 1;
      const limit = 1;


      const totalPages = Math.ceil(user.address.length / limit);


      const adjustedPage = Math.min(page, totalPages);

      const skip = (adjustedPage - 1) * limit;
      const addresses = user.address.slice(skip, skip + limit);

      res.render("user/address", {
        user: req.session.user,
        addresses,
        currentPage: adjustedPage,
        totalPages
      });
    } catch (error) {
      console.error("Error loading addresses:", error);
      res.status(500).send("Server Error");
    }
  },

  // Create New Address
  async createAddress(req, res) {
    try {
      const userId = req.session.user.id;


      const {
        house, street, city, landmark,
        district, state, country, pinCode
      } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const newAddress = {
        house,
        street,
        landmark,
        city,
        district,
        state,
        country,
        pinCode
      };

      user.address.push(newAddress);
      await user.save();

      res.status(201).json({
        message: "Address created successfully",
        address: newAddress
      });
      // console.log("creation of the address --------------------> Done!");
    } catch (error) {
      console.error("Error creating address:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },

  // Update Existing Address
  async updateAddress(req, res) {

    try {
      const userId = req.session.user.id;
      const { addressId } = req.params;
      const {
        house, street, landmark, city,
        district, state, country, pinCode
      } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const addressIndex = user.address.findIndex(
        addr => addr._id.toString() === addressId
      );

      if (addressIndex === -1) {
        return res.status(404).json({ message: "Address not found" });
      }

      // Update address fields
      user.address[addressIndex] = {
        ...user.address[addressIndex],
        house: house,
        street,
        landmark,
        city,
        district,
        state,
        country,
        pinCode
      };

      await user.save();

      res.status(200).json({
        message: "Address updated successfully",
        address: user.address[addressIndex]
      });
      // console.log("updation of the address --------------------> Done!");

    } catch (error) {
      console.error("Error updating address:", error);
      res.status(500).json({ message: "Server error" });
    }
  },

  // Remove Address
  async removeAddress(req, res) {
    try {
      const userId = req.session.user.id;
      const { addressId } = req.params;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Filter out the address to remove
      user.address = user.address.filter(
        addr => addr._id.toString() !== addressId
      );

      await user.save();

      res.status(200).json({
        message: "Address removed successfully"
      });
    } catch (error) {
      console.error("Error removing address:", error);
      res.status(500).json({ message: "Server error" });
    }
  },

  //=================================================================>

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
