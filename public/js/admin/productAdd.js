 let cropper;
 let currentInput;

 document.querySelectorAll(".productImagesAdd").forEach((input, index) => {
   input.addEventListener("change", function(event) {
     const file = event.target.files[0];
     if (file && file.type.startsWith("image/")) {
       currentInput = event.target;

       const reader = new FileReader();
       reader.onload = function(e) {
         const imageToCrop = document.getElementById("imageToCrop");
         imageToCrop.src = e.target.result;

         if (cropper) cropper.destroy();
         cropper = new Cropper(imageToCrop, {
           aspectRatio: 1,
           viewMode: 1,
           autoCropArea: 0.8,
         });

         const cropImageModal = new bootstrap.Modal(document.getElementById("cropImageModal"));
         cropImageModal.show();
       };
       reader.readAsDataURL(file);
     } else {
       alert("Please select a valid image file.");
     }
   });
 });

 document.getElementById("cropButton").addEventListener("click", function() {
   if (cropper) {
     const croppedCanvas = cropper.getCroppedCanvas();
     const croppedImage = croppedCanvas.toDataURL("image/jpeg");

     const previewId = currentInput.id.replace("image", "roundPreview");
     document.getElementById(previewId).src = croppedImage;

     const blob = dataURLToBlob(croppedImage);
     const croppedFile = new File([blob], "cropped-image.jpg", {
       type: "image/jpeg"
     });
     const dataTransfer = new DataTransfer();
     dataTransfer.items.add(croppedFile);
     currentInput.files = dataTransfer.files;

     const cropImageModal = bootstrap.Modal.getInstance(document.getElementById("cropImageModal"));
     cropImageModal.hide();
   }
 });

 function dataURLToBlob(dataURL) {
   const parts = dataURL.split(",");
   const mime = parts[0].match(/:(.*?);/)[1];
   const binary = atob(parts[1]);
   const array = [];
   for (let i = 0; i < binary.length; i++) {
     array.push(binary.charCodeAt(i));
   }
   return new Blob([new Uint8Array(array)], {
     type: mime
   });
 }

 document.addEventListener('DOMContentLoaded', function() {
   const categorySelect = document.getElementById('productType');
   const stockContainer = document.getElementById('stockManagementContainer');
   const stockManagementInput = document.getElementById('productStockManagement');

   const sizeConfigs = {
     'bottomware': Array.from({length: 9}, (_, i) => (28 + (i * 2)).toString()),
     'topware': ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
   };

   function createStockFields() {
     const productType= categorySelect.value.toLowerCase();
    //  console.log("THIS IS MY PRODUCT TYPE-->"+productType);
     
    const sizes = sizeConfigs[productType] || [];
    // console.log("THIS IS MY SIZES-->"+sizes);
    

     stockContainer.innerHTML = '';
     sizes.forEach(size => {
       const col = document.createElement('div');
       col.className = 'col-md-3 mb-3';
       col.innerHTML = `
         <div class="input-group">
           <span class="input-group-text">${size}</span>
           <input 
             type="number" 
             class="form-control stock-input" 
             data-size="${size}" 
             value="0"
             min="0"
             placeholder="Quantity"
           >
         </div>
       `;
       stockContainer.appendChild(col);
     });

     document.querySelectorAll('.stock-input').forEach(input => {
       input.addEventListener('change', updateStockManagement);
     });

     updateStockManagement();
   }

   function updateStockManagement() {
 const stockData = [];
 document.querySelectorAll('.stock-input').forEach(input => {
     const quantity = parseInt(input.value) || 0;
     if (quantity >= 0) {
         stockData.push({
             size: input.dataset.size,
             quantity: quantity
         });
     }
 });
 stockManagementInput.value = JSON.stringify(stockData); 
}


   categorySelect.addEventListener('change', function() {
     createStockFields(this);
   });

   createStockFields(categorySelect);
 });

 document.getElementById("productForm").addEventListener("submit", function(event) {
  event.preventDefault();

  const errorMessages = document.querySelectorAll(".error-message");
  errorMessages.forEach((msg) => msg.remove());

  const productName = document.getElementById("productName").value.trim();
  const productPrice = parseFloat(document.getElementById("productPrice").value);
  const offerPrice = parseFloat(document.getElementById("offerPrice").value) || null;  
  const productDescription = document.getElementById("productDescription").value.trim();
  const productTags = document.getElementById("productTags").value.trim();
  const productBrand = document.getElementById("productBrand").value.trim();
  const productWarranty = document.getElementById("productWarranty").value.trim();
  const productReturnPolicy = document.getElementById("productReturnPolicy").value.trim();
  const productCategory = document.getElementById("productCategory").value;
  const productStockManagement = document.getElementById("productStockManagement").value;
  const productType = document.getElementById("productType").value;
  const productImages = [...document.querySelectorAll(".productImagesAdd")];

  let hasError = false;

  function showError(inputId, message) {
    const inputElement = document.getElementById(inputId);
    const error = document.createElement("p");
    error.classList.add("text-danger", "error-message");
    error.textContent = message;
    inputElement.parentElement.appendChild(error);
    hasError = true;
  }

  if (!productName) {
    showError("productName", "Product name is required.");
  }

  if (isNaN(productPrice) || productPrice <= 0) {
    showError("productPrice", "Product price must be greater than zero.");
  }

  if (offerPrice !== null && (isNaN(offerPrice) || offerPrice < 1 || offerPrice >= productPrice )) {
    // console.log("THIS IS MY OFFER PRICE-->");
    
    showError("offerPrice", "Offer price must be greater than zero and less than the original price.");
  }

  if (!productDescription) {
    showError("productDescription", "Product description is required.");
  }

  if (!productCategory) {
    showError("productCategory", "Please select a product category.");
  }

  if (!productType) {
    showError("productType", "Please select a product type.");
  }

  if (productTags && productTags.split(",").length > 10) {
    showError("productTags", "You can add up to 10 tags only.");
  }

  if (productBrand && productBrand.length > 50) {
    showError("productBrand", "Brand name cannot exceed 50 characters.");
  }

  if (productWarranty && !/^\d+\s*(year|month)s?$/.test(productWarranty)) {
    showError("productWarranty", "Warranty must be in the format (e.g., 1 year, 6 months).");
  }

  if (productReturnPolicy && !/^\d+\s*(day|month)s?$/.test(productReturnPolicy)) {
    showError("productReturnPolicy", "Return policy must be in the format (e.g., 30 days, 1 month).");
  }

  if (productStockManagement) {
    try {
      const stockData = JSON.parse(productStockManagement);
      if (!Array.isArray(stockData)) {
        throw new Error();
      }
      const totalStock = stockData.reduce((sum, item) => sum + (item.quantity || 0), 0);
      if (totalStock <= 0) {
        showError("productStockManagement", "Total stock must be greater than zero.");
      }
      stockData.forEach((item) => {
        if (!item.size || item.quantity < 0) {
          throw new Error();
        }
      });
    } catch {
      showError("productStockManagement", "Invalid stock management data. Please check your inputs.");
    }
  }

  let imageUploaded = false;
  productImages.forEach((input, index) => {
    if (input.files.length > 0) {
      imageUploaded = true;
      const file = input.files[0];
      if (!file.type.startsWith("image/")) {
        showError(`image${index}`, `Image ${index + 1} must be a valid image file.`);
      }
    }
  });

  if (!imageUploaded) {
    showError("image0", "Please upload at least one product image.");
  }

  if (hasError) {
    Swal.fire({
      icon: "error",
      title: "Validation Error",
      text: "Please fix the highlighted errors before submitting.",
    });
    return;
  }

  Swal.fire({
    title: "Add Product",
    text: "Are you sure you want to add this product?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Yes, add it!",
    cancelButtonText: "Cancel",
  }).then((result) => {
    if (result.isConfirmed) {
      this.submit();
    }
  });
});
