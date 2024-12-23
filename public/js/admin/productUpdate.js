// Existing cropper.js functionality (unchanged)
const cropperInstances = [];
const croppedImages = [];

function previewAndCrop(event, index) {
    const file = event.target.files[0];
    if (!file) return;

    // Check if the uploaded file is an image
    if (!file.type.startsWith("image/")) {
        Swal.fire("Invalid File", "Please upload a valid image file.", "error");
        event.target.value = ""; // Clear the file input
        return;
    }

    // Create modal for cropping
    const modal = `
        <div class="modal fade" id="cropModal${index}" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Crop Image</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <img id="cropPreview${index}" style="max-width: 100%" />
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="startCropping(${index})">Crop</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modal);

    const cropPreview = document.getElementById(`cropPreview${index}`);
    const cropModal = new bootstrap.Modal(document.getElementById(`cropModal${index}`));

    // Set the cropping preview
    cropPreview.src = URL.createObjectURL(file);
    cropModal.show();

    // Initialize or reinitialize the cropper
    if (cropperInstances[index]) {
        cropperInstances[index].destroy();
    }
    cropperInstances[index] = new Cropper(cropPreview, {
        aspectRatio: 3 / 4,
        viewMode: 1,
        autoCropArea: 1,
        scalable: true,
        zoomable: true,
        movable: true,
    });
}

function startCropping(index) {
    const cropper = cropperInstances[index];
    if (!cropper) return;

    // Crop the image and convert it to a Blob
    cropper.getCroppedCanvas().toBlob((blob) => {
        croppedImages[index] = blob;

        const roundPreview = document.getElementById(`roundPreview${index}`);
        const fileInput = document.getElementById(`productImage${index + 1}`);

        // Update the round preview with the cropped image
        roundPreview.src = URL.createObjectURL(blob);
        roundPreview.style.display = "block";

        // Update the corresponding file input with the cropped image Blob
        const dataTransfer = new DataTransfer();
        const croppedFile = new File([blob], fileInput.files[0].name, { type: 'image/png' });
        dataTransfer.items.add(croppedFile);
        fileInput.files = dataTransfer.files;

        // Close the modal
        const cropModal = bootstrap.Modal.getInstance(document.getElementById(`cropModal${index}`));
        cropModal.hide();
        document.getElementById(`cropModal${index}`).remove();
    });
}

// New validation logic
document.getElementById("productForm").addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent default form submission

    // Clear previous error messages
    const errorMessages = document.querySelectorAll(".error-message");
    errorMessages.forEach((msg) => msg.remove());

    // Get form values
    const productName = document.getElementById("productName").value.trim();
    const productPrice = parseFloat(document.getElementById("productPrice").value);
    const offerPriceInput = document.getElementById("offerPrice");
    const offerPrice = parseFloat(offerPriceInput.value) || null;
    const productDescription = document.getElementById("productDescription").value.trim();
    const productImages = [...document.querySelectorAll(".product-image")];

    let hasError = false;

    // Helper function to add error messages
    function showError(inputId, message) {
        const inputElement = document.getElementById(inputId);
        const error = document.createElement("p");
        error.classList.add("text-danger", "error-message");
        error.textContent = message;
        inputElement.parentElement.appendChild(error);
        hasError = true;
    }

    // Validate fields
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

    // Validate image uploads
    let imageUploaded = false;
    productImages.forEach((input) => {
        if (input.files.length > 0) {
            imageUploaded = true;

            // Check file type
            const file = input.files[0];
            if (!file.type.startsWith("image/")) {
                showError(input.id, "Only image files are allowed.");
            }
        }
    });

    if (!imageUploaded) {
        showError("productImage1", "Please upload at least one product image.");
    }

    // If there are errors, return early
    if (hasError) {
        Swal.fire("Error", "Please fix the highlighted errors.", "error");
        return;
    }

    // Confirm submission if no errors
    Swal.fire({
        title: "Are you sure?",
        text: "Do you want to add this product?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes, add it!",
    }).then((result) => {
        if (result.isConfirmed) {
            event.target.submit(); // Submit the form
        }
    });
});
