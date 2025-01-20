const walletModel=require('../../models/walletModel')
const  orders=require('../../models/orderModel')

module.exports={
    async getWallet (req,res){

        try{
            console.log("--->>>getWallet");

            console.log("enterd to getWallet--->");
            

            const userId=req.session.user.id
            console.log(userId);
            
            
            if (!userId) {
                
                return res.redirect('/login');
            }

            const page = parseInt(req.query.page) || 1;
            const limit = 5; 



            
            const wallet=await walletModel.findOne({userId});
            
            
            if (!wallet) {
                return res.render('user/wallet', {
                    balance: 0,
                    transactionHistory: null,
                    currentPage: 1,
                    totalPages: 1,
                    hasNextPage: false,
                    hasPrevPage: false
                });
            }

            // Calculate pagination values
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const totalTransactions = wallet.transactionHistory.length;
            const totalPages = Math.ceil(totalTransactions / limit);

            // Get paginated transactions
            const paginatedTransactions = wallet.transactionHistory
                .sort((a, b) => b.transactionDate - a.transactionDate) // Sort by date descending
                .slice(startIndex, endIndex);

            return res.render('user/wallet', {
                userId: req.session.user.id,
                balance: wallet.balance,
                transactionHistory: paginatedTransactions,
                currentPage: page,
                totalPages: totalPages,
                hasNextPage: endIndex < totalTransactions,
                hasPrevPage: startIndex > 0
            });
            
        }catch(error){
            console.error('Error in getWallet:', error);
            return res.status(500).render('error', { message: 'Internal server error' });
        
        }
            

    }
}