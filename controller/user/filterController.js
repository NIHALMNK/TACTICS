const productModel = require('../../models/productModel');
const categoryModel = require('../../models/categoryModel');

const filterController = {
    async filterProducts(req, res) {
        try {
            console.log("--->>>filterProducts");

            const {
                sort,
                priceRange,
                nameRange,
                search,
                category,
                page = 1
            } = req.query;

            const limit = 8;
            const skip = (page - 1) * limit;

           
            let query = { isDeleted: false };

            
            if (search) {
                query.name = { $regex: search, $options: 'i' };
            }

           
            if (category) {
                const categoryDoc = await categoryModel.findOne({
                    name: category,
                    isDeleted: false
                });
                if (categoryDoc) {
                    query.category = categoryDoc._id;
                }
            }

            
            if (priceRange && priceRange !== 'all') {
                const priceRanges = {
                    '$0.00 - $50.00': { $gte: 0, $lte: 50 },
                    '$50.00 - $100.00': { $gt: 50, $lte: 100 },
                    '$100.00 - $150.00': { $gt: 100, $lte: 150 },
                    '$150.00 - $200.00': { $gt: 150, $lte: 200 },
                    '$200.00+': { $gt: 200 }
                };
                
                if (priceRanges[priceRange]) {
                    query.price = priceRanges[priceRange];
                }
            }

            let sortConfig = {};
            switch (sort) {
                case 'popularity':
                    sortConfig = { viewCount: -1 };
                    break;
                case 'average rating':
                    sortConfig = { rating: -1 };
                    break;
                case 'newness':
                    sortConfig = { createdAt: -1 };
                    break;
                case 'price: low to high':
                    sortConfig = { price: 1 };
                    break;
                case 'price: high to low':
                    sortConfig = { price: -1 };
                    break;
                default:
                    sortConfig = { createdAt: -1 }; 
            }

          
            if (nameRange) {
                switch (nameRange.toLowerCase()) {
                    case 'a-z':
                        sortConfig = { name: 1 };
                        break;
                    case 'z-a':
                        sortConfig = { name: -1 };
                        break;
                }
            }

            
            const totalProducts = await productModel.countDocuments(query);
            const totalPages = Math.ceil(totalProducts / limit);

            
          
            const products = await productModel
                .find(query)
                .populate('category')
                .sort(sortConfig)
                .skip(skip)
                .limit(limit);

         
            const categories = await categoryModel.find({ isDeleted: false });

            const response = {
                products,
                currentPage: parseInt(page),
                totalPages,
                totalProducts,
                categories
            };

            res.json(response);

        } catch (error) {
            console.error('Filter error:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: error.message
            });
        }
    }
};

module.exports = filterController;