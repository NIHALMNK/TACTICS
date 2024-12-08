const bcrypt = require("bcrypt");
const otpGenerator = require("otp-generator");
const OTP = require("../../models/otpModel");
const User = require("../../models/userRegister");
const sendEmail = require("../../utils/mail");
const passport = require("passport");


module.exports = {  


    async loadRegister(req, res) {
        try {
          res.render("user/register", { user: req.session.user || null });
        } catch (error) {
          console.error("Error loading register:", error);
          res.status(500).send("Server Error");
        }
      },

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


  // check User

      async checkUser(req, res) {
        try {
          const { name, email, phno, password } = req.body;
    
          
          const existingUser = await User.findOne({ email });
          if (existingUser) {
            return res.json({
              success: false,
              message: "User already registered.",
            });
          }
    
          
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
      console.log("this is the resetOTP : " + email);


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
      console.log('Resending OTP: ' + otp);

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

      return res.status(200).json({ success: true, message: "OTP resent successfully." });
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

    
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.render("user/login", {
          message: "Incorrect password.",
          user: null,
        });
      }

      
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


}
