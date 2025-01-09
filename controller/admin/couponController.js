const couponModel = require('../../models/couponModel')


module.exports = {



    async loadcoupon(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = 3; 
            
            // Calculate skip value for pagination
            const skip = (page - 1) * limit;
            
            // Get total count of coupons for calculating total pages
            const totalCoupons = await couponModel.countDocuments();
            const totalPages = Math.ceil(totalCoupons / limit);
            
            // Fetch coupons with pagination
            const coupon = await couponModel.find()
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 }); 

                const startIndex = skip + 1;
            
            res.render('admin/couponManagement', {
                coupon,
                currentPage: page,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: totalPages,
                startIndex,
            });

        } catch (error) {
            console.error('Error in couponManagement:', error)
            res.status(500).render('admin/error', {
                message: 'Error loading couponManagement'
            })
        }
    },

    async loadAddCoupon(req, res) {
        try {
            res.render('admin/couponAdd')
        } catch (error) {
            console.error('Error in add-coupon:', error)
            res.status(500).render('admin/error', {
                message: 'Error loading add-coupon'
            })
        }
    },


    //adding 


    async loadAddCoupon(req, res) {

        try {

            res.render('admin/couponAdd')

        } catch (error) {
            console.error('Error in add-coupon:', error)
            res.status(500).render('admin/error', {
                message: 'Error loading add-coupon'
            })
        }



    },

    async addCoupon(req, res) {

        try {

            console.log(req.body);
            let { couponCode,
                discountType,
                discountValue,
                maxDiscount,
                minPurchase,
                startDate,
                endDate,
                usageLimit,
                status } = req.body;

            if (!couponCode, !discountType, !discountValue, !maxDiscount, !minPurchase, !startDate, !endDate, !usageLimit, !status) {

                return res.status(400).json({
                    success: false,
                    message: 'Please fill in all required fields.',
                });
            }

             // Validate status
        const validStatuses = ['Active', 'Inactive'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value. Must be "Active" or "Inactive".',
            });
        }

            const coupon = await couponModel.findOne({ code: couponCode });

            if (coupon) {
                return res.status(400).json({
                    success: false,
                    message: 'this coupon code have alredy existed',
                });
            }


            const NewCoupon = new couponModel({
                code: couponCode,
                discountType: discountType,
                discountValue: discountValue,
                maxDiscount: maxDiscount,
                minPurchase: minPurchase,
                startDate: startDate,
                endDate: endDate,
                usageLimit: usageLimit,
                isActive: status
            });

            console.log("NewCoupon===============>");
            console.log(NewCoupon);


            await NewCoupon.save()

            return res.status(200).json({
                success: true,
                message: 'Coupon has been created successfully.',
            });



        } catch (error) {
            console.error(':', error);
            res.status(500).json({
                success: false,
                message: 'Error on  adding coupon : Please try again later ',
            });
        }


    },



    async loadUpdate(req, res) {
        const { id } = req.params

        


        try {

            const coupon = await couponModel.findById(id);
            if (!coupon) {
                return res.status(404).json({ message: "coupon not found" });
            }

            
            return res.render("admin/couponUpdate", { coupon });



        } catch (error) {
            console.error("Error loading coupon update page:", error);
            return res.status(500).json({ message: "Error loading coupon update page" });

        }


    },

    async updateCoupon(req, res) {
        try {

            let { id } = req.params

            let { couponCode,
                discountType,
                discountValue,
                maxDiscount,
                minPurchase,
                startDate,
                endDate,
                usageLimit,
                status } = req.body;

            if (!couponCode, !discountType, !discountValue, !maxDiscount, !minPurchase, !startDate, !endDate, !usageLimit, !status) {

                return res.status(400).json({
                    success: false,
                    message: 'Please fill in all required fields.',
                });
            }

             // Validate status
        const validStatuses = ['Active', 'Inactive'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value. Must be "Active" or "Inactive".',
            });
        }

            const coupon = await couponModel.findOne({ code: couponCode, _id: { $ne: id } });

            if (coupon) {
                return res.status(400).json({
                    success: false,
                    message: 'this coupon code have alredy existed',
                });
            }


            const updateCoupon = await couponModel.findByIdAndUpdate(
                id,
                {
                    $set: {
                        code: couponCode,
                        discountType: discountType,
                        discountValue: discountValue,
                        maxDiscount: maxDiscount,
                        minPurchase: minPurchase,
                        startDate: startDate,
                        endDate: endDate,
                        usageLimit: usageLimit,
                        isActive: status,
                    }

                },
                { new: true } 
            );

            console.log("NewCoupon===============>");
            console.log(updateCoupon);

            if (!updateCoupon) {
                return res.status(404).json({
                    success: false,
                    message: 'Coupon not found.',
                });
            }



            return res.status(200).json({
                success: true,
                message: 'coupon updated successfully',
            });





        } catch (error) {
            console.error("Error loading coupon side update page:", error);
            return res.status(500).json({ message: "Error loading coupon side update page" });

        }






    },








}