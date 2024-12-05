const User = require('../../models/userRegister');  // Adjust the path based on your project structure

// Load User Management Page
const loadUserManagementPage = async (req, res) => {
    try {
        if (!req.session.admin) {
            return res.status(200).render('admin/login',{message: "" });
        }
        const users = await User.find({});
        // console.log(users, "Fetched users for rendering ---------------->:");

        return res.status(200).render('admin/userManagement', {
            users: users, // Pass data for rendering, if required
            msg: users.length === 0 ? 'No users found' : ''
        });
    } catch (error) {
        console.error('Error rendering user management page:', error);
        res.status(500).send('Internal Server Error');
    }
};

const getUsersAsJson = async (req, res) => {
    try {
        const users = await User.find({});
        // console.log(users, "Fetched users for API ---------------->:");

        return res.status(200).json(users); // Send JSON response
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


// Ban or Unban User
// Ban or Unban User
const userBan = async (req, res) => {
    try {
        const email = req.query.email; // Get the email from query parameters

        // Find the user by email
        const user = await User.findOne({ email: email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the user is an admin
        if (user.role === 'admin') {
            return res.status(400).json({ message: 'Admins cannot be banned' });
        }

        // Toggle the isDeleted flag (ban/unban)
        user.isDeleted = !user.isDeleted;
        await user.save(); // Save the updated user data

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
        const email = req.query.email;  // Get the email from query parameters

        // Find the user by email
        const user = await User.findOne({ email: email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Send the user details back to the client
        res.status(200).json({
            username: user.name,
            email: user.email,
            role: user.role,
            joinDate: user.createdAt.toISOString().split('T')[0], // Format the date as needed
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
