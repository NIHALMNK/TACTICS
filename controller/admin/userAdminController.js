const User = require('../../models/userRegister');  

// Load User Management Page
const loadUserManagementPage = async (req, res) => {
    try {
        if (!req.session.admin) {
            return res.status(200).render('admin/login',{message: "" });
        }
        const users = await User.find({});
        // console.log(users, "Fetched users for rendering ---------------->:");

        return res.status(200).render('admin/userManagement', {
            users: users,
            msg: users.length === 0 ? 'No users found' : ''
        });
    } catch (error) {
        console.error('Error rendering user management page:', error);
        res.status(500).send('Internal Server Error');
    }
};

// get USer AS JSON
const getUsersAsJson = async (req, res) => {
    try {
        const users = await User.find({});
        // console.log(users, "Fetched users for API ---------------->:");

        return res.status(200).json(users); 
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


// user ban
const userBan = async (req, res) => {
    try {
        const email = req.query.email; 

       
        const user = await User.findOne({ email: email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

       
        if (user.role === 'admin') {
            return res.status(400).json({ message: 'Admins cannot be banned' });
        }

        
        user.isDeleted = !user.isDeleted;
        await user.save(); 
        const status = user.isDeleted ? 'banned' : 'unbanned';
        console.log(`User ${status}: ${email}`);
        return res.status(200).json({ message: `User ${status} successfully`, isDeleted: user.isDeleted });

    } catch (error) {
        console.error('Error banning/unbanning user:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};


// View User Details
const viewUserDetails = async (req, res) => {
    try {
        const email = req.query.email;  

        const user = await User.findOne({ email: email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        
        res.status(200).json({
            username: user.name,
            email: user.email,
            role: user.role,
            joinDate: user.createdAt.toISOString().split('T')[0], 
            isDeleted: user.isDeleted
        });

    } catch (error) {
        console.error('Error fetching user details:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = {
    loadUserManagementPage,
    getUsersAsJson,
    userBan,
    viewUserDetails
};
