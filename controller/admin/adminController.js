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
        }
    },
    
    
    async loadLogin(req, res){
        try {
            if (!req.session.admin) {
                return res.status(200).render('admin/login',{message: "" });
            }
            return res.status(200).redirect('/admin/dashboard');
        } catch (error) {
            // console.log('2 --->' + error);
        }
    },
    
    
    async loginForm(req, res) {
        try {
            const { email, password } = req.body;
    
            console.log('Admin email:', email);
            
    
            
            const admin = await User.findOne({ email });
            if (!admin) {

               
                return res.render('admin/login', { message: 'User not found' });
            }
    
            
            if (admin.role !== 'admin') {
                
                return res.render('admin/login', { message: 'User not found' });
            }
    
         
            const isPasswordValid = await bcrypt.compare(password, admin.password);
            if (!isPasswordValid) {
                
                return res.render('admin/login', { message: 'Incorrect password' });
            }
    
            
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
            
            req.session.destroy((err) => {
                if (err) {
                    console.error('Error during logout:', err);
                    return res.status(500).send('Unable to log out');
                }
                
                return res.redirect('/admin/login');
            });
        } catch (error) {
            console.error('Error in admin logout:', error);
            res.status(500).send('Server Error');
        }
    }
    
    
    
};