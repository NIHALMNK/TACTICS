

const Category = require("../../models/categoryModel");
const Products = require("../../models/productModel");



async function deleteCategoryById(id, isPermanent = false) {
  try {
      if (isPermanent) {
          
          return await Category.findByIdAndDelete(id);
      } else {
          
          return await Category.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
      }
  } catch (error) {
      console.error("Error deleting category:", error);
      throw error;
  }
}

module.exports = {

    async loadCategoryManagement(req, res) {
        try {
          if (!req.session.admin) {
              return res.status(200).render('admin/login', { message: "" });
          }
      
          // Pagination setup
          let page = parseInt(req.query.page) || 1;
          const limit = 5; // Number of categories per page
      
          // Find total number of non-deleted categories
          const totalCategories = await Category.countDocuments({ isDeleted: false });
          const totalPages = Math.ceil(totalCategories / limit);
      
          // Ensure page is within valid range
          page = Math.max(1, Math.min(page, totalPages));
      
          const skip = (page - 1) * limit;
      
          // Find categories for current page
          const categories = await Category.find({ isDeleted: false })
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 }); // Sort by most recent first
          
          // If current page is empty, find the last page with categories
          if (categories.length === 0 && totalPages > 0) {
            // Recursively find the last page with categories
            let lastNonEmptyPage = page;
            while (lastNonEmptyPage > 0) {
              lastNonEmptyPage--;
              const lastPageCategories = await Category.find({ isDeleted: false })
                .skip(lastNonEmptyPage * limit)
                .limit(limit)
                .sort({ createdAt: -1 });
              
              if (lastPageCategories.length > 0) {
                // Redirect to the last page with categories
                return res.redirect(`/admin/category?page=${lastNonEmptyPage + 1}`);
              }
            }
          }
      
          const categoriesWithCounts = await Promise.all(
            categories.map(async (category) => {
              const productCount = await Products.countDocuments({ category: category._id });
              return {
                ...category.toObject(),
                productCount,
              };
            })
          );
      
          return res.status(200).render("admin/categoryManagement", { 
            categoriesWithCounts,
            msg: categoriesWithCounts.length === 0 ? "No categories found" : null,
            currentPage: page,
            totalPages: totalPages
          });
        } catch (error) {
          console.error("Error loading category management page:", error);
          return res.status(500).send("Internal Server Error");
        }
      },

  async loadUpdateCategory(req, res) {
    const categoryId = req.params .id; 
    try {
        const category = await Category.findById(categoryId); 
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        
        return res.render("admin/categoryUpdate", { category: category });
    } catch (error) {
        console.error("Error loading category update page:", error);
        return res.status(500).json({ message: "Error loading category update page" });
    }
},

async updateCategory(req, res) {
  const { categoryId, categoryName, categoryDescription } = req.body;
  let categoryImage;
 
  try {
      // Check for existing category with the same name (case-insensitive)
      const existingCategory = await Category.findOne({
          name: { $regex: new RegExp(`^${categoryName}$`, 'i') },
          _id: { $ne: categoryId }, // Exclude current category
          isDeleted: false
      });

      if (existingCategory) {
          // Clean up uploaded file if there's a duplicate
          if (req.file) {
              const fs = require('fs');
              fs.unlink(req.file.path, (err) => {
                  if (err) console.error("Error deleting uploaded file:", err);
              });
          }
          return res.status(409).json({ 
              success: false, 
              message: "A category with this name already exists." 
          });
      }

      const category = await Category.findById(categoryId);
      if (!category) {
          // Clean up uploaded file if category not found
          if (req.file) {
              const fs = require('fs');
              fs.unlink(req.file.path, (err) => {
                  if (err) console.error("Error deleting uploaded file:", err);
              });
          }
          return res.status(404).json({ 
              success: false, 
              message: "Category not found" 
          });
      }
 
      category.name = categoryName;
      category.description = categoryDescription;
 
      if (req.file) {
          const oldImagePath = category.image ? `public${category.image}` : null;
          
          categoryImage = req.file.path.split("public")[1];
          category.image = categoryImage;

          
          if (oldImagePath) {
              const fs = require('fs');
              fs.unlink(oldImagePath, (err) => {
                  if (err) console.error("Error deleting old image file:", err);
              });
          }
      }
 
      category.updatedAt = Date.now();
 
      await category.save();
      return res.status(200).json({ 
          success: true, 
          message: "Successfully updated category" 
      });
  } catch (error) {
     
      if (req.file) {
          const fs = require('fs');
          fs.unlink(req.file.path, (err) => {
              if (err) console.error("Error deleting uploaded file:", err);
          });
      }
      console.error("Error updating category:", error);
      return res.status(500).json({ 
          success: false, 
          message: "Error updating category" 
      });
  }
},
  
  async loadAddCategoryPage(req, res) {
    try {
      return res.status(200).render("admin/categoryAdd");
    } catch (error) {
      console.error("Error loading category adding page:", error);
      return res
        .status(500)
        .json({ message: "Error loading category loading page" });
    }
  },

  

async postAddCategoryPage(req, res) {
    try {
       
        const { categoryName, categoryDescription } = req.body;
       
        if (!req.file) {
            return res.status(400).json({ val: false, msg: "No image file uploaded." });
        }

       
        const existingCategory = await Category.findOne({
            name: { $regex: new RegExp(`^${categoryName}$`, 'i') },
            isDeleted: false
        });

        if (existingCategory) {
            
            if (req.file) {
                const fs = require('fs');
                fs.unlink(req.file.path, (err) => {
                    if (err) console.error("Error deleting uploaded file:", err);
                });
            }
            return res.status(409).json({ 
                val: false, 
                msg: "A category with this name already exists." 
            });
        }

        const imagePath = req.file.path.split("public")[1];
        console.log("Stored Image Path:", imagePath);
        
        const newCategory = new Category({
            name: categoryName,
            description: categoryDescription,
            image: imagePath,
            isDeleted: false,
        });
        
        await newCategory.save();
        console.log("New Category Saved:", newCategory);
        
        return res.status(201).json({
            message: "Category added successfully!",
            category: newCategory,
        });
    } catch (error) {
        
        if (req.file) {
            const fs = require('fs');
            fs.unlink(req.file.path, (err) => {
                if (err) console.error("Error deleting uploaded file:", err);
            });
        }
        console.error("Error in postAddCategoryPage:", error);
        return res.status(500).json({ message: "Error adding category." });
    }
},

async loadDelCategoryPage(req, res) {
    try {
        const deletedCategories = await Category.find({ isDeleted: true });
        return res.render("admin/categoryDelete", { deletedProducts: deletedCategories }); // Pass the correct variable
    } catch (error) {
        console.error("Error fetching deleted categories:", error);
        return res.status(500).send("Internal Server Error");
    }
},

async recoverCategory(req, res) {
  try {
      const { id } = req.params;
      const category = await Category.findByIdAndUpdate(id, { isDeleted: false }, { new: true });

      if (!category) {
          return res.status(404).json({ success: false, message: "Category not found" });
      }

      res.json({ success: true, message: "Category recovered successfully" });
  } catch (error) {
      console.error("Error recovering category:", error);
      res.status(500).json({ success: false, message: "Error recovering category" });
  }
},

async permanentDeleteCategory(req, res) {
  try {
      const { id } = req.params;
      const category = await Category.findByIdAndDelete(id);

      if (!category) {
          return res.status(404).json({ success: false, message: "Category not found" });
      }

      res.json({ success: true, message: "Category permanently deleted" });
  } catch (error) {
      console.error("Error permanently deleting category:", error);
      res.status(500).json({ success: false, message: "Error permanently deleting category" });
  }
},





async deleteCategory(req, res) {
  const { categoryId } = req.body;
  try {
      const category = await deleteCategoryById(categoryId);
      if (!category) {
          return res.status(404).json({ success: false, message: "Category not found" });
      }
      return res.status(200).json({ success: true, message: "Category successfully unlinked" });
  } catch (error) {
      return res.status(500).json({ success: false, message: "Error unlinking category" });
  }
},






};
