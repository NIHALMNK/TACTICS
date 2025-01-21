const adminAuth = (req, res, next) => {
    if (!req.session.admin) {
        return res.status(200).render('admin/login', { message: "" });
    }
    next();
};

module.exports = adminAuth;