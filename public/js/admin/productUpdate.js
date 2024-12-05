document.addEventListener("DOMContentLoaded", () => {
    let cropper;
    let currentImageIndex;

    const previewImage = (input, previewId) => {
        const file = input.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById(previewId).src = e.target.result;
                openCropModal(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    function openCropModal(imageSrc) {
        const imageToCrop = document.getElementById('imageToCrop');
        imageToCrop.src = imageSrc;

        const cropImageModal = new bootstrap.Modal(document.getElementById('cropImageModal'));
        cropImageModal.show();

        if (cropper) {
            cropper.destroy();
        }
        cropper = new Cropper(imageToCrop, {
            aspectRatio: 1,
            viewMode: 1,
            autoCropArea: 1,
        });
    }

    document.getElementById('cropButton').addEventListener('click', () => {
        const canvas = cropper.getCroppedCanvas();
        canvas.toBlob((blob) => {
            const file = new File([blob], "croppedImage.png", {
                type: "image/png",
                lastModified: Date.now(),
            });

            const previewId = `roundPreview${currentImageIndex}`;
            document.getElementById(previewId).src = canvas.toDataURL();

            const cropImageModal = bootstrap.Modal.getInstance(document.getElementById('cropImageModal'));
            cropImageModal.hide();

            const formData = new FormData();
            formData.append("productImages[]", file);
        }, "image/png");
    });

    for (let i = 0; i < 4; i++) {
        const fileInput = document.getElementById(`image${i}`);
        if (fileInput) {
            fileInput.addEventListener("change", (event) => {
                currentImageIndex = i;
                const file = event.target.files[0];
                if (file && !file.type.startsWith('image/')) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Non-Image File Detected',
                        text: 'The selected file is not an image. Cropping session will start.',
                    }).then(() => {
                        previewImage(event.target, `roundPreview${i}`);
                        document.getElementById(`imageError${i}`).style.display = "block";
                    });
                } else {
                    previewImage(event.target, `roundPreview${i}`);
                    document.getElementById(`imageError${i}`).style.display = "none";
                }
            });
        }
    }

    const form = document.querySelector(".updatePdt");
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            // Reset previous error messages
            document.querySelectorAll('.text-danger').forEach((el) => {
                el.style.display = 'none';
            });

            let isValid = true;
            const productName = document.getElementById("productName").value.trim();
            const productPrice = document.getElementById("productPrice").value.trim();
            const productDescription = document.getElementById("productDescription").value.trim();
            const productStock = document.getElementById("productStock").value.trim();
            const productCategory = document.getElementById("productCategory").value;
            const productOfferPrice = document.getElementById("productOfferPrice").value.trim();

            // Check required fields
            if (!productName) {
                document.getElementById('productNameError').style.display = 'block';
                isValid = false;
            }
            if (!productPrice) {
                document.getElementById('productPriceError').style.display = 'block';
                isValid = false;
            }
            if (!productDescription) {
                document.getElementById('productDescriptionError').style.display = 'block';
                isValid = false;
            }
            if (!productStock) {
                document.getElementById('productStockError').style.display = 'block';
                isValid = false;
            }
            if (!productCategory) {
                document.getElementById('productCategoryError').style.display = 'block';
                isValid = false;
            }

            // Offer price validation
            if (productOfferPrice && parseFloat(productOfferPrice) > parseFloat(productPrice)) {
                document.getElementById('productOfferPriceError').style.display = 'block';
                isValid = false;
            }

            // Image validation
            let imageFilesValid = true;
            for (let i = 0; i < 4; i++) {
                const fileInput = document.getElementById(`image${i}`);
                if (fileInput && fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    if (!file.type.startsWith('image/')) {
                        imageFilesValid = false;
                        document.getElementById(`imageError${i}`).style.display = 'block';
                    }
                }
            }

            if (!imageFilesValid) {
                isValid = false;
            }

            if (!isValid) {
                Swal.fire({
                    icon: 'error',
                    title: 'Validation Error',
                    text: 'Please fix the highlighted errors.',
                });
                return;
            }

            // Proceed with form submission
            const formData = new FormData();
            formData.append("productName", productName);
            formData.append("productDescription", productDescription);
            formData.append("productPrice", productPrice);
            formData.append("productOfferPrice", productOfferPrice);
            formData.append("productStock", productStock);
            formData.append("productCategory", productCategory);
            formData.append("productId", document.getElementById("productId").value);

            for (let i = 0; i < 4; i++) {
                const fileInput = document.getElementById(`image${i}`);
                if (fileInput && fileInput.files.length > 0) {
                    formData.append(`productImage${i}`, fileInput.files[0]);
                }
            }

            try {
                const response = await fetch(`/admin/productManagement/update/${document.getElementById("productId").value}`, {
                    method: "PUT",
                    body: formData,
                });

                if (response.ok) {
                    const result = await response.json();
                    Swal.fire({
                        icon: 'success',
                        title: 'Product Updated',
                        text: result.message || "Product updated successfully!",
                    }).then(() => {
                        window.location.href = "/admin/productManagement";
                    });
                } else {
                    const errorResult = await response.json();
                    throw new Error(errorResult.message || "Failed to update the product");
                }
            } catch (error) {
                console.error("Error updating product:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: "An error occurred while updating the product. Please try again.",
                });
            }
        });
    }
});
