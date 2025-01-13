const productModel = require('../../models/productModel');
const wishlistModel=require('../../models/wishlistModel')


module.exports={

    async addToWishlist(req,res){
        try{
            console.log("working...............");

            const userID = req.session.user?.id;
           console.log(userID);
           
            
            console.log(req.body);
            
            const {selectedSize,productId}=req.body;

            if(!selectedSize||!productId){
                return res.status(400).json({ success: false, message: 'Missing required fields' });
            }

            const product = await productModel.findById(productId);
            if(!product){
                return res.status(400).json({success:false,message: 'Product not found'  })
            }
;
            let wishlist=await wishlistModel.findOne({userId : userID})

            if(!wishlist){
                wishlist=new wishlistModel({userId:userID,products:[]})
            }

          
            

            if(wishlist){
                wishlist.products.push({
                    productId:productId,
                    size:selectedSize,
                })
            }

           await wishlist.save()


            

        }catch(error){
            console.error('Error adding to wishlist:', error);
            res.status(500).json({ success: false, message: 'Error adding to wishlist', error: error.message });
       


        }

    },
  

    async LoadWishlist(req,res){
        try {
            const userId = req.session.user.id;
            if(!userId){
                return res.redirect('/login');
            }
    
            const wishlist = await wishlistModel.findOne({userId})
                .populate({
                    path: 'products.productId',
                    model: 'Product',
                    select: 'offerPrice price name images isDeleted' 
                });
    
            if(!wishlist){
                return res.render("user/wishlist", {
                    status: false,
                    wishlist: null,
                });
            }
    
            wishlist.products = wishlist.products.filter(product => product.productId !== null);
            await wishlist.save();
            
            const isWishlistEmpty = wishlist.products.length === 0;
            
            return res.render("user/wishlist", {
                status: !isWishlistEmpty,
                wishlist
            });
    
        } catch(error) {
            console.error("Error wishlist:", error);
            res.status(500).json({ message: "Server error" });
        }
    },



    async removeFromWishlist(req, res) {
        try {
            const { id } = req.params;
            const userId = req.session.user?.id;
    
            if (!userId) {
                return res.status(401).json({ 
                    status: false, 
                    message: 'User not authenticated' 
                });
            }
    
            if (!id) {
                return res.status(400).json({ 
                    status: false, 
                    message: 'Product ID is required' 
                });
            }
    
            const wishlist = await wishlistModel.findOne({ userId });
    
            if (!wishlist) {
                return res.status(404).json({ 
                    status: false, 
                    message: 'Wishlist not found' 
                });
            }
    
            // Check if the product exists in the wishlist
            const productExists = wishlist.products.some(product => 
                product._id.toString() === id
            );
    
            if (!productExists) {
                return res.status(404).json({ 
                    status: false, 
                    message: 'Product not found in wishlist' 
                });
            }
    
            // Remove the product
            wishlist.products = wishlist.products.filter(product => 
                product._id.toString() !== id
            );
    
            await wishlist.save();
    
            return res.status(200).json({ 
                status: true, 
                message: 'Product removed from wishlist successfully' 
            });
    
        } catch (error) {
            console.error('Wishlist removal error:', error);
            return res.status(500).json({ 
                status: false, 
                message: 'Error removing product from wishlist',
                error: error.message 
            });
        }
    },


    
}