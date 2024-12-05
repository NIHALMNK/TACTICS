const User = require('../../models/userRegister');
const bcrypt = require('bcrypt');


module.exports ={




    async loadDashboard(req, res){
        try {
            if (!req.session.admin) {
                return res.status(200).redirect('/admin/login');
            }
            return res.status(200).render('admin/dashboard', { admin: req.session.admin });
        } catch (error) {
            console.log('1 --->' + error);
        }
    },
    
    
    async loadLogin(req, res){
        try {
            if (!req.session.admin) {
                return res.status(200).render('admin/login',{message: "" });
            }
            return res.status(200).redirect('/admin/dashboard');
        } catch (error) {
            console.log('2 --->' + error);
        }
    },
    
    
    async loginForm(req, res) {
        try {
            const { email, password } = req.body;
    
            console.log('Admin email:', email);
            console.log('Admin password:', password);
    
            // Step 1: Find the user by email
            const admin = await User.findOne({ email });
            if (!admin) {
                // Email not found in the database
                return res.render('admin/login', { message: 'User not found' });
            }
    
            // Step 2: Check if the role is 'admin'
            if (admin.role !== 'admin') {
                // The user is not an admin
                return res.render('admin/login', { message: 'User not found' });
            }
    
            // Step 3: Compare the provided password with the stored hashed password
            const isPasswordValid = await bcrypt.compare(password, admin.password);
            if (!isPasswordValid) {
                // Password is incorrect
                return res.render('admin/login', { message: 'Incorrect password' });
            }
    
            // Step 4: Successful login, set session and redirect
            req.session.admin = {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
            };
    
            return res.redirect('/admin/dashboard');
        } catch (error) {
            console.error('Error in admin login:', error);
            res.status(500).send('Server Error');
        }
    },
    
    
    async logout(req, res) {
        try {
            // Destroy the session
            req.session.destroy((err) => {
                if (err) {
                    console.error('Error during logout:', err);
                    return res.status(500).send('Unable to log out');
                }
                // Redirect to login page after logout
                return res.redirect('/admin/login');
            });
        } catch (error) {
            console.error('Error in admin logout:', error);
            res.status(500).send('Server Error');
        }
    }
    
    
    
};