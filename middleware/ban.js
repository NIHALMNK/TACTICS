const userModal = require('../models/userRegister');

let banCheck = async (req, res, next) => {

    if (req.session.loggedIn) {
        const {email} = req.session.user;
        console.log(email)
        const user = await userModal.findOne({ email });
        if (user && user.isDeleted) {
            return res.render('error/baned');
        }
    }
    return next();
};

module.exports = banCheck;