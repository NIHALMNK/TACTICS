const User = require('../../models/userRegister');  



const loadUserManagementPage = async (req, res) => {
    try {
        if (!req.session.admin) {
            return res.status(200).render('admin/login', { message: "" });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = 10; 
        const skip = (page - 1) * limit;

        const totalUsers = await User.countDocuments({});
        
        const totalPages = Math.ceil(totalUsers / limit);

        const users = await User.find({})
            .sort({ createdAt: -1 }) 
            .skip(skip)
            .limit(limit);

        return res.status(200).render('admin/userManagement', {
            users: users,
            currentPage: page,
            totalPages: totalPages,
            totalUsers: totalUsers,
            msg: users.length === 0 ? 'No users found' : ''
        });
    } catch (error) {
        console.error('Error rendering user management page:', error);
        res.status(500).send('Internal Server Error');
    }
};

const getUsersAsJson = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;

        const totalUsers = await User.countDocuments({});
        
        const totalPages = Math.ceil(totalUsers / limit);

        const users = await User.find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return res.status(200).json({
            users: users,
            currentPage: page,
            totalPages: totalPages,
            totalUsers: totalUsers
        }); 
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};



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
        return res.status(200).json({ message: `User ${status} successfully`, isDeleted: user.isDeleted });

    } catch (error) {
        console.error('Error banning/unbanning user:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};


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

