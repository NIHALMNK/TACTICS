// controllers/userController.js
const bcrypt = require("bcrypt");
const otpGenerator = require("otp-generator");
const OTP = require("../models/otpModel");
const User = require("../models/userRegister");
const sendEmail = require("../utils/mail");
const productModel = require("../models/productModel");
const categoryModel = require("../models/categoryModel");
const passport = require("passport");

module.exports = {
  // Render the registration page
  async loadRegister(req, res) {
    try {
      res.render("user/register", { user: req.session.user || null });
    } catch (error) {
      console.error("Error loading register:", error);
      res.status(500).send("Server Error");
    }
  },

  // Render the login page
  async loadLogin(req, res) {
    try {
      res.render("user/login", {
        user: req.session.user || null,
        message: null,
      });
    } catch (error) {
      console.error("Error loading login:", error);
      res.status(500).send("Server Error");
    }
  },

  // Render OTP page
  async loadOTP(req, res) {
    try {
      const { email } = req.session.user;
      return res
        .status(200)
        .render("user/otp", { email, user: req.session.user || null });
    } catch (error) {
      console.error("Error loading OTP page:", error);
      res.status(500).send("Server Error");
    }
  },

  // Check if user exists and send OTP for verification
  async checkUser(req, res) {
    try {
      const { name, email, phno, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.json({
          success: false,
          message: "User already registered.",
        });
      }

      // Save user data in session for OTP verification
      req.session.user = { name, email, phno, password, verified: false };

      // Generate OTP
      const otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });

      // Save OTP
      await OTP.create({
        email,
        otp,
        createdAt: Date.now(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5-minute expiry
      });

      // Send OTP via email
      sendEmail(email, otp);

      res.json({ success: true, message: "OTP sent successfully!" });
    } catch (error) {
      console.error("Error in checkUser:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Resend OTP
  async resendOTP(req, res) {
    try {
      const { email } = req.body;

      // Check if OTP exists
      const existingOTP = await OTP.findOne({ email });
      if (!existingOTP) {
        return res
          .status(404)
          .json({ success: false, message: "No OTP found for this email." });
      }

      // Generate and resend OTP
      const otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
      await OTP.findOneAndUpdate(
        { email },
        {
          otp,
          createdAt: Date.now(),
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        },
        { upsert: true }
      );

      sendEmail(email, otp);
      res
        .status(200)
        .json({ success: true, message: "OTP resent successfully." });
    } catch (error) {
      console.error("Error in resendOTP:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Verify OTP and register user
  async verifyOTP(req, res) {
    try {
      const { email, otp } = req.body;

      // Find OTP record
      const otpRecord = await OTP.findOne({ email, otp });
      if (!otpRecord || otpRecord.expiresAt < Date.now()) {
        if (otpRecord) await OTP.deleteOne({ email, otp });
        return res
          .status(401)
          .json({ success: false, message: "Invalid or expired OTP." });
      }

      // Hash the password before saving the user
      const hashedPassword = await bcrypt.hash(req.session.user.password, 10);

      // Save the user
      const newUser = new User({
        name: req.session.user.name,
        email,
        phone: req.session.user.phno,
        password: hashedPassword,
        role: req.session.user.role || "user",
        isValid: true,
      });
      const savedUser = await newUser.save();

      // Remove OTP record
      await OTP.deleteOne({ email, otp });

      // Update session with full user details
      req.session.user = {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        phone: savedUser.phone,
        role: savedUser.role,
        isValid: savedUser.isValid,
      };
      req.session.loggedIn = true;

      res
        .status(200)
        .json({ success: true, message: "OTP verified, account activated!" });
    } catch (error) {
      console.error("Error in verifyOTP:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // User login
  async checkLogin(req, res) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.render("user/login", {
          message: "User not found.",
          user: null,
        });
      }

      // Compare hashed password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.render("user/login", {
          message: "Incorrect password.",
          user: null,
        });
      }

      // Set session user
      req.session.user = {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isValid: user.isValid,
      };
      req.session.loggedIn = true;

      res.redirect("/home");
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

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

  async loadShop(req, res) {
    try {
      // Get the category filter from the query parameters
      const categoryName = req.query.category;

      let products;

      if (categoryName) {
        // Fetch products of the selected category
        const category = await categoryModel.findOne({
          name: categoryName,
          isDeleted: false,
        });

        if (!category) {
          return res.status(404).send("Category not found");
        }

        products = await productModel
          .find({ category: category._id, isDeleted: false })
          .populate("category");
      } else {
        // Fetch all products if no category filter is applied
        products = await productModel
          .find({ isDeleted: false })
          .populate("category");
      }

      // Render the shop page with the filtered products
      res.render("user/shop", { user: req.session.user, products });
    } catch (error) {
      console.error("Error loading shop:", error);
      res.status(500).send("Server Error");
    }
  },

  // Load user profile
  async loadDashboard(req, res) {
    try {
      res.render("user/dashboard", { user: req.session.user });
    } catch (error) {
      console.error("Error loading dashboard:", error);
      res.status(500).send("Server Error");
    }
  },

  //load contacts

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
      // Get product ID from route parameters
      const productId = req.params.id;

      // Fetch product from the database
      const product = await productModel
        .findById(productId)
        .populate("category");
      if (!product) {
        return res.status(404).send("Product not found");
      }

      // Fetch all products for additional information
      const productAll = await productModel.find({ isDeleted: false });
      const relatedProducts = await productModel.find({
        tags: { $in: product.tags },
        _id: { $ne: product._id },
      });

      // Render the product detail page and pass the product data to the view
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

//logout: 
async logout(req, res) {
  try {
    req.session.destroy();
    res.clearCookie("session_id");
    res.redirect("/home");
    } catch (error) {
      console.error("Error logging out:", error);
      res.status(500).send("Server error");

}
},


  //end{code}

  GoogleLogin: (req, res, next) => {
    passport.authenticate("google", {
      scope: ["profile", "email"],
    })(req, res, next);
  },

  GoogleCallbacks: (req, res, next) => {
    passport.authenticate(
      "google",
      {
        failureRedirect: "/register",
      },
      (err, user, info) => {
        if (err) {
          return next(err);
        }
        if (!user) {
          return res.redirect("/register");
        }
        req.session.user = {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
        req.session.loggedIn = true;
        return res.redirect("/home");
      }
    )(req, res, next);
  },
};
