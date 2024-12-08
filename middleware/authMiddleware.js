let authCheck = (req, res, next) => {
    if (['/dashboard', '/wishlist', '/cart','/order','/address','/wallet','/profile'].includes(req.url)) {
        if (!req.session.loggedIn) {
            return res.redirect('/register');
        }
        return next();
    } else if (['/register', '/login','/register/otp'].includes(req.url)) {
        if (req.session.loggedIn) {
            return res.redirect('/home');
        }
        return next();
    }
    return next();
};


module.exports = authCheck;