document.getElementById("productForm").addEventListener("submit", async function (event) {
  event.preventDefault();

  const errorMessages = document.querySelectorAll(".error-message");
  errorMessages.forEach((msg) => msg.remove());

  const productId = document.getElementById("productId").value;
  const formData = new FormData();
  
  formData.append("productName", document.getElementById("productName").value);
  formData.append("productPrice", document.getElementById("productPrice").value);
  formData.append("productOfferPrice", document.getElementById("offerPrice").value || document.getElementById("productPrice").value);
  formData.append("productDescription", document.getElementById("productDescription").value);
  formData.append("productTags", document.getElementById("productTags").value);
  formData.append("productBrand", document.getElementById("productBrand").value);
  formData.append("productWarranty", document.getElementById("productWarranty").value);
  formData.append("productReturnPolicy", document.getElementById("productReturnPolicy").value);
  formData.append("productCategory", document.getElementById("productCategory").value);
  formData.append("productType", document.getElementById("productType").value);
  formData.append("productStockManagement", document.getElementById("productStockManagement").value);

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

  if (!productId) {
      console.error("Missing product ID. This field is required for updates.");
      hasError = true;
  }

  if (!document.getElementById("productName").value) {
      showError("productName", "Product name is required.");
  }

  const price = parseFloat(document.getElementById("productPrice").value);
  if (isNaN(price) || price <= 0) {
      showError("productPrice", "Please enter a valid price greater than zero.");
  }

  const offerPrice = parseFloat(document.getElementById("offerPrice").value);
  if (!isNaN(offerPrice) && offerPrice >= price) {
      showError("offerPrice", "Offer price must be less than the original price.");
  }

  if (!document.getElementById("productDescription").value) {
      showError("productDescription", "Product description is required.");
  }

  if (hasError) {
      Swal.fire("Error", "Please fix the highlighted errors.", "error");
      return;
  }

  const fileInputs = document.querySelectorAll('input[type="file"][name="productImages[]"]');
  fileInputs.forEach((input, index) => {
      if (input.files[0]) {
          formData.append('productImages[]', input.files[0]);
      }
  });

  try {
      const response = await fetch(`/admin/productManagement/update/${productId}`, {
          method: 'PUT',
          body: formData
      });

      const result = await response.json();

      if (result.success) {
          Swal.fire({
              title: "Success",
              text: "Product updated successfully",
              icon: "success"
          }).then(() => {
              window.location.href = '/admin/productManagement';
          });
      } else {
          throw new Error(result.message);
      }
  } catch (error) {
      console.error('Error:', error);
      Swal.fire({
          title: 'Error!',
          text: error.message || 'An error occurred while updating the product',
          icon: 'error'
      });
  }
});

let cropper = null;
let currentInput = null;

const cropImageModal = new bootstrap.Modal(document.getElementById('cropImageModal'));

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

  const inputIndex = currentInput.id.replace('productImages', '');
  const previewImage = document.getElementById(`roundPreview${inputIndex}`);

  const reader = new FileReader();
  reader.onload = function (e) {
      const imageToCrop = document.getElementById('imageToCrop');
      imageToCrop.src = e.target.result;

      if (cropper) {
          cropper.destroy();
      }

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

      cropImageModal.show();
  };

  reader.readAsDataURL(file);
}

function handleCrop() {
  if (!cropper || !currentInput) {
      console.error('Cropper or input not initialized');
      return;
  }

  const croppedCanvas = cropper.getCroppedCanvas({
      width: 500,
      height: 500,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high'
  });

  const croppedImage = croppedCanvas.toDataURL('image/jpeg', 0.9);
  const inputIndex = currentInput.id.replace('productImages', '');
  const previewImage = document.getElementById(`roundPreview${inputIndex}`);
  previewImage.src = croppedImage;

  croppedCanvas.toBlob((blob) => {
      const fileName = currentInput.files[0].name;
      const croppedFile = new File([blob], fileName, { type: 'image/jpeg' });

      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(croppedFile);
      currentInput.files = dataTransfer.files;

      const hiddenInput = document.querySelector(`input[name="existingImages[]"][value="${currentInput.value}"]`);
      if (hiddenInput) {
          hiddenInput.value = croppedImage;
      }

      cropImageModal.hide();
      cropper.destroy();
      cropper = null;
  }, 'image/jpeg', 0.9);
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
      const productType = categorySelect.value.toLowerCase();
      const sizes = sizeConfigs[productType] || [];
      
      let currentStock = {};
      try {
          const stockData = JSON.parse(stockManagementInput.value);
          stockData.forEach(item => {
              currentStock[item.size] = item.quantity;
          });
      } catch (e) {
          console.error('Error parsing stock data:', e);
      }

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

  categorySelect.addEventListener('change', createStockFields);
  createStockFields();

  document.querySelectorAll('input[type="file"][name="productImages[]"]').forEach(input => {
      input.addEventListener('change', handleImageSelect);
  });

  document.getElementById('cropButton').addEventListener('click', handleCrop);

  document.getElementById('cropImageModal').addEventListener('hidden.bs.modal', function () {
      if (cropper) {
          cropper.destroy();
          cropper = null;
      }
  });
});