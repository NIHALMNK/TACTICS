

module.exports={

    async loadDashboard (req,res){
        try {
            if (!req.session.admin) {
                return res.status(200).redirect('/admin/login');
            }
            return res.status(200).render('admin/dashboard', { admin: req.session.admin });
        } catch (error) {
        }
    
    },
}