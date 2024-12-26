 
   document.getElementById("productForm").addEventListener("submit", async function (event) {
    event.preventDefault(); 

    // Clear previous error messages
    const errorMessages = document.querySelectorAll(".error-message");
    errorMessages.forEach((msg) => msg.remove());

    // Get form values
    const productId = document.getElementById("productId").value.trim();
    const productName = document.getElementById("productName").value.trim();
    const productPrice = parseFloat(document.getElementById("productPrice").value);
    const offerPrice = parseFloat(document.getElementById("offerPrice").value) || null;
    const productDescription = document.getElementById("productDescription").value.trim();
    const productTags = document.getElementById("productTags").value.trim();
    const productBrand = document.getElementById("productBrand").value.trim();
    const productWarranty = document.getElementById("productWarranty").value.trim();
    const productReturnPolicy = document.getElementById("productReturnPolicy").value.trim();
    const productCategory = document.getElementById("productCategory").value;
    const productType = document.getElementById("productType").value
    const productStockManagement = document.getElementById("productStockManagement").value;
    
    
    let hasError = false;

   
    function showError(inputId, message) {
        const inputElement = document.getElementById(inputId);
       
        
        if (!inputElement) {
        console.error(`Element with id "${inputId}" not found.`);
        return;
    }
        const error = document.createElement("p");
        error.classList.add("text-danger", "error-message");
        error.textContent = message;
        inputElement.parentElement.appendChild(error);
        hasError = true;
    }

    // Validate fields
    if (!productId) {
        console.error("Missing product ID. This field is required for updates.");
        hasError = true; 
    }

    if (!productName) {
        showError("productName", "Product name is required.");
    }

    if (isNaN(productPrice) || productPrice <= 0) {
        showError("productPrice", "Please enter a valid price greater than zero.");
    }

    if (offerPrice !== null && (isNaN(offerPrice) || offerPrice >= productPrice)) {
        showError("offerPrice", "Offer price must be less than the original price.");
    }

    if (!productDescription) {
        showError("productDescription", "Product description is required.");
    }

    if (!productCategory) {
        showError("productCategory", "Please select a product category.");
    }

    if (productTags && productTags.split(",").length > 10) {
        showError("productTags", "You can add up to 10 tags only.");
    }

    if (productBrand && productBrand.length > 50) {
        showError("productBrand", "Brand name cannot exceed 50 characters.");
    }

    if (productWarranty && !/^\d+\s*(day|year|month)s?$/i.test(productWarranty)) {
        showError("productWarranty", "Warranty must be in the format (e.g., 1 year, 6 months).");
    }

    if (productReturnPolicy && !/^\d+\s*(day|month)s?$/i.test(productReturnPolicy)) {
        showError("productReturnPolicy", "Return policy must be in the format (e.g., 30 days, 1 month).");
    }

    // Validate stock management (if applicable)
    if (productStockManagement) {
        try {
            const stockData = JSON.parse(productStockManagement);
            if (!Array.isArray(stockData)) {
                throw new Error();
            }
            stockData.forEach((item) => {
                if (!item.size || !item.quantity || item.quantity <= 0) {
                    throw new Error();
                }
            });
        } catch {
            showError("productStockManagement", "Invalid stock management data. Please check your inputs.");
        }
    }

    if (hasError) {
        Swal.fire("Error", "Please fix the highlighted errors.", "error");
        return;
    }


    try {
        const response = await fetch(`/admin/productManagement/update/${productId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productName,
              productPrice,
              offerPrice,
              productDescription,
              productTags,
              productBrand,
              productCategory,
              productStockManagement,
              productWarranty,
              productReturnPolicy,
                productType,
            })
            
            
            
          });

    const result = await response.json();
        
        

        if (result.success) {
          Swal.fire({
        title: "Are you sure?",
        text: "Do you want to update this product?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes, update it!",
    }).then(() => {
                window.location.href = '/admin/productManagement';
            });
        } else {
            Swal.fire({
                title: 'Error!',
                text: result.message,
                icon: 'error'
            });
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            title: 'Error!',
            text: 'An error occurred while updating the product',
            icon: 'error'
        });
    }

  
    });

    //=============================>>>>

 // Image Cropping Logic
 let cropper = null;
 let currentInput = null;
 let currentModal = null;
 
 // Initialize cropper modal
 const cropImageModal = new bootstrap.Modal(document.getElementById('cropImageModal'));
 
 // Function to handle image selection
 function handleImageSelect(event) {
   const file = event.target.files[0];
   currentInput = event.target;
 
   if (!file || !file.type.startsWith('image/')) {
     Swal.fire({
       title: 'Error',
       text: 'Please select a valid image file.',
       icon: 'error'
     });
     return;
   }
 
   // Get preview image element
   const inputIndex = currentInput.id.replace('productImages', '');
   const previewImage = document.getElementById(`roundPreview${inputIndex}`);
 
   // Read the file
   const reader = new FileReader();
   reader.onload = function (e) {
     const imageToCrop = document.getElementById('imageToCrop');
     imageToCrop.src = e.target.result;
 
     // Destroy existing cropper if it exists
     if (cropper) {
       cropper.destroy();
     }
 
     // Wait for image to load before initializing cropper
     imageToCrop.onload = function () {
       cropper = new Cropper(imageToCrop, {
         aspectRatio: 1,
         viewMode: 1,
         autoCropArea: 0.8,
         responsive: true,
         restore: true,
         modal: true,
         guides: true,
         center: true,
         highlight: false,
         cropBoxMovable: true,
         cropBoxResizable: true,
         toggleDragModeOnDblclick: false
       });
     };
 
     // Show the modal
     cropImageModal.show();
   };
 
   reader.readAsDataURL(file);
 }
 
 // Function to handle crop button click
 function handleCrop() {
   if (!cropper || !currentInput) {
     console.error('Cropper or input not initialized');
     return;
   }
 
   const croppedCanvas = cropper.getCroppedCanvas({
     width: 500, // Set desired output size
     height: 500,
     imageSmoothingEnabled: true,
     imageSmoothingQuality: 'high'
   });
 
   const croppedImage = croppedCanvas.toDataURL('image/jpeg', 0.9);
 
   // Update preview image
   const inputIndex = currentInput.id.replace('productImages', '');
   const previewImage = document.getElementById(`roundPreview${inputIndex}`);
   previewImage.src = croppedImage;
 
   // Convert data URL to File object
   croppedCanvas.toBlob((blob) => {
     const fileName = currentInput.files[0].name;
     const croppedFile = new File([blob], fileName, { type: 'image/jpeg' });
 
     // Update the file input
     const dataTransfer = new DataTransfer();
     dataTransfer.items.add(croppedFile);
     currentInput.files = dataTransfer.files;
 
     // Upload the cropped image to the server
     uploadCroppedImage(croppedFile)
       .then(imageUrl => {
         // Update the image URL in the input (if necessary)
         const hiddenInput = document.querySelector(`input[name="existingImages[]"][value="${currentInput.value}"]`);
         if (hiddenInput) {
           hiddenInput.value = imageUrl; 
         }
 
         // Close modal and cleanup
         cropImageModal.hide();
         cropper.destroy();
         cropper = null;
       })
       .catch(err => {
         Swal.fire({
           title: 'Error',
           text: 'Failed to upload cropped image.',
           icon: 'error'
         });
         cropImageModal.hide();
         cropper.destroy();
         cropper = null;
       });
   }, 'image/jpeg', 0.9);
 }
 
 // Function to upload the cropped image to the server
 function uploadCroppedImage(file) {
   const formData = new FormData();
   formData.append('croppedImage', file);
 
   return fetch('/admin/productManagement/update/:id', {
     method: 'POST',
     body: formData,
   })
     .then(response => response.json())
     .then(data => {
       if (data.success) {
         return data.imageUrl; // Return the uploaded image URL
       } else {
         throw new Error('Failed to upload image');
       }
     });
 }
 
 // Initialize event listeners
 document.addEventListener('DOMContentLoaded', function () {
   // Add change listeners to all image inputs
   document.querySelectorAll('input[type="file"][name="productImages[]"]').forEach(input => {
     input.addEventListener('change', handleImageSelect);
   });
 
   // Add click listener to crop button
   document.getElementById('cropButton').addEventListener('click', handleCrop);
 
   // Handle modal close
   document.getElementById('cropImageModal').addEventListener('hidden.bs.modal', function () {
     if (cropper) {
       cropper.destroy();
       cropper = null;
     }
   });
 });
 
 // Utility: Convert data URL to Blob
 function dataURLToBlob(dataURL) {
   const parts = dataURL.split(",");
   const mime = parts[0].match(/:(.*?);/)[1];
   const binary = atob(parts[1]);
   const array = [];
   for (let i = 0; i < binary.length; i++) {
     array.push(binary.charCodeAt(i));
   }
   return new Blob([new Uint8Array(array)], { type: mime });
 }
 

//============================================================================>>>>>>>>>>

document.addEventListener('DOMContentLoaded', function() {
  const categorySelect = document.getElementById('productType');
  const stockContainer = document.getElementById('stockManagementContainer');
  const stockManagementInput = document.getElementById('productStockManagement');

  // Size configurations
  const sizeConfigs = {
    'bottomware': Array.from({length: 9}, (_, i) => (28 + (i * 2)).toString()),
    'topware': ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
  };

  
  function createStockFields(category) {
    const productType= categorySelect.value.toLowerCase();
    console.log("THIS IS MY PRODUCT TYPE-->"+productType);
    
    
    
    
    // Get appropriate sizes
    const sizes = sizeConfigs[productType] || [];
    console.log("THIS IS MY SIZE-->"+sizes);
    
    // Get current stock data
    let currentStock = {};
    try {
      const stockData = JSON.parse(stockManagementInput.value);
      stockData.forEach(item => {
        currentStock[item.size] = item.quantity;
      });
    } catch (e) {
      console.error('Error parsing stock data:', e);
    }

    // Create HTML for stock inputs
    stockContainer.innerHTML = '';
    sizes.forEach(size => {
      const quantity = currentStock[size] || 0;
      const col = document.createElement('div');
      col.className = 'col-md-3 mb-3';
      col.innerHTML = `
        <div class="input-group">
          <span class="input-group-text">${size}</span>
          <input 
            type="number" 
            class="form-control stock-input" 
            data-size="${size}" 
            value="${quantity}"
            min="0"
            placeholder="Quantity"
          >
        </div>
      `;
      stockContainer.appendChild(col);
    });

    // Add change listeners to new inputs
    document.querySelectorAll('.stock-input').forEach(input => {
      input.addEventListener('change', updateStockManagement);
    });

    // Update hidden input
    updateStockManagement();
  }

  // Function to update hidden stock management input
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

  // Listen for category changes
  categorySelect.addEventListener('change', function() {
    createStockFields(this);
  });

  // Initialize stock fields with current category
  createStockFields(categorySelect);

  // Add change listeners to existing stock inputs
  document.querySelectorAll('.stock-input').forEach(input => {
    input.addEventListener('change', updateStockManagement);
  });

  
});
