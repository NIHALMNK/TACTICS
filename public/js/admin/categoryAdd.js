let cropper;
let croppedImageBlob = null;

// Input Validation Functions
function validateName() {
    const nameError = document.getElementById('nameError');
    const nameValue = categoryName.value.trim();
    const nameRegex = /^[A-Za-z\s]{3,50}$/; 
    const isValid = nameRegex.test(nameValue);
    nameError.style.display = isValid ? 'none' : 'block';
    return isValid;
}

function validateDescription() {
    const descError = document.getElementById('descError');
    const descValue = categoryDescription.value.trim();
    const isValid = descValue.length >= 10 && descValue.length <= 200;
    descError.style.display = isValid ? 'none' : 'block';
    return isValid;
}

function validateImage() {
    const imageError = document.getElementById('imageError');
    const isValid = croppedImageBlob !== null; 
    imageError.style.display = isValid ? 'none' : 'block';
    return isValid;
}

categoryName.addEventListener('input', validateName);
categoryDescription.addEventListener('input', validateDescription);

categoryImage.addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const cropModalImage = document.getElementById('cropModalImage');
            cropModalImage.src = e.target.result;

            const cropModal = new bootstrap.Modal(document.getElementById('cropModal'));
            cropModal.show();

            if (cropper) cropper.destroy(); 
            cropper = new Cropper(cropModalImage, {
                aspectRatio: 1,
                viewMode: 1,
                minCropBoxWidth: 100,
                minCropBoxHeight: 100,
            });
        };
        reader.readAsDataURL(file);
    }
});

// Crop Confirmation
document.getElementById('cropConfirmBtn').addEventListener('click', function () {
    if (cropper) {
        cropper.getCroppedCanvas().toBlob((blob) => {
            croppedImageBlob = blob;
            const imageUrl = URL.createObjectURL(blob);

            roundPreview.src = imageUrl;
            roundPreview.style.display = 'block';
            photoPlaceholder.style.display = 'none';
            removeImageBtn.style.display = 'block';

            const cropModal = bootstrap.Modal.getInstance(document.getElementById('cropModal'));
            cropModal.hide();

            validateImage(); 
        });
    }
});

// Remove Image
removeImageBtn.addEventListener('click', function () {
    roundPreview.src = '';
    roundPreview.style.display = 'none';
    photoPlaceholder.style.display = 'block';
    removeImageBtn.style.display = 'none';
    categoryImage.value = '';
    croppedImageBlob = null;
    if (cropper) cropper.destroy();
    validateImage(); 
});

// Form Submission
categoryForm.addEventListener('submit', function (e) {
    e.preventDefault(); 

    const isNameValid = validateName();
    const isDescValid = validateDescription();
    const isImageValid = validateImage();

    if (isNameValid && isDescValid && isImageValid) {
        const formData = new FormData();
        formData.append('categoryName', categoryName.value.trim());
        formData.append('categoryDescription', categoryDescription.value.trim());
        formData.append(
            'categoryImage',
            new File([croppedImageBlob], 'category-image.png', { type: 'image/png' })
        );

        fetch('/admin/category/add', {
            method: 'POST',
            body: formData,
        })
            .then((response) => {
                if (!response.ok) {
                    return response.text().then((text) => {
                        throw new Error(text || 'Failed to add category');
                    });
                }
                return response.json();
            })
            .then((data) => {
                Swal.fire({
                    icon: 'success',
                    title: 'Category Added',
                    text: 'The category has been successfully added!',
                }).then(() => {
                    window.location.reload(); 
                });
            })
            .catch((error) => {
                console.error('Error fetch:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: `User already exists with the name`,
                });
            });
    } else {
        validateName();
        validateDescription();
        validateImage();

        Swal.fire({
            icon: 'warning',
            title: 'Invalid Form',
            text: 'Please correct the errors in the form before submitting.',
        });
    }
});
