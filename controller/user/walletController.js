const walletModel=require('../../models/walletModel')
const  orders=require('../../models/orderModel')

module.exports={
    async getWallet (req,res){

        const userId=req.session.user.id

        if (!userId) {
            
            return res.redirect('/login');
        }

        const wallet=await walletModel.findOne({userId});
     

        if (!wallet){
            return res.render('user/wallet',{
                balance:0,
                transactionHistory:null,
            })
        }else{
            console.log(wallet);
            
            return res.render('user/wallet',{
                userId:req.session.user.id,
                balance:wallet.balance,
                transactionHistory:wallet.transactionHistory
            })
        }



    }
}