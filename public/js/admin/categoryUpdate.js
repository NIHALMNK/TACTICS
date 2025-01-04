let cropper;
let croppedImageBlob = null;

const categoryName = document.getElementById('categoryName');
const categoryDescription = document.getElementById('categoryDescription');
const categoryImage = document.getElementById('categoryImage');
const roundPreview = document.getElementById('roundPreview');
const photoPlaceholder = document.getElementById('photoPlaceholder');
const removeImageBtn = document.getElementById('removeImageBtn');

function validateName() {
    const nameError = document.getElementById('nameError');
    const nameValue = categoryName.value.trim();
    const isValid = /^[a-zA-Z0-9\s]{3,50}$/.test(nameValue);

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
    const file = categoryImage.files[0];

    if (file) {
        const validTypes = ['image/jpeg', 'image/png'];
        const maxSize = 2 * 1024 * 1024; 

        if (!validTypes.includes(file.type)) {
            imageError.textContent = 'Only JPG and PNG files are allowed.';
            imageError.style.display = 'block';
            return false;
        }

        if (file.size > maxSize) {
            imageError.textContent = 'File size must be under 2MB.';
            imageError.style.display = 'block';
            return false;
        }
    }

    const isValid = croppedImageBlob !== null || (roundPreview.src && roundPreview.src !== '');
    imageError.style.display = isValid ? 'none' : 'block';
    return isValid;
}

categoryName.addEventListener('input', validateName);
categoryDescription.addEventListener('input', validateDescription);
categoryImage.addEventListener('change', validateImage);

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

document.getElementById('cropConfirmBtn').addEventListener('click', function () {
    if (cropper) {
        cropper.getCroppedCanvas().toBlob((blob) => {
            croppedImageBlob = blob;
            const imageUrl = URL.createObjectURL(blob);

            roundPreview.src = imageUrl;
            roundPreview.style.display = 'block';
            photoPlaceholder.style.display = 'none';
            removeImageBtn.style.display = 'inline-block';
            categoryImage.value = ''; 

            const cropModal = bootstrap.Modal.getInstance(document.getElementById('cropModal'));
            cropModal.hide();
            validateImage();
        });
    }
});

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

document.getElementById('updateCategoryForm').addEventListener('input', function () {
    const isFormValid = validateName() && validateDescription() && validateImage();
    const submitButton = document.querySelector('button[type="submit"]');
    submitButton.disabled = !isFormValid;
});

document.getElementById("updateCategoryForm").addEventListener('submit', async function (e) {
    e.preventDefault();

    if (!validateName() || !validateDescription() || !validateImage()) {
        return;
    }

    const feedbackMessage = document.getElementById('feedbackMessage');
    feedbackMessage.style.display = 'none';

    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    const formData = new FormData(this);

    if (croppedImageBlob) {
        formData.set('categoryImage', croppedImageBlob, 'category-image.jpg');
    }

    try {
        const response = await fetch('/admin/category/update', {
            method: 'PUT',
            body: formData,
        });

        const result = await response.json();

        feedbackMessage.className = `feedback-message alert ${result.success ? 'alert-success' : 'alert-danger'}`;
        feedbackMessage.textContent = result.message || 'An unexpected error occurred.';
        feedbackMessage.style.display = 'block';

        if (result.success) {
            setTimeout(() => {
                window.location.href = '/admin/category';
            }, 1500);
        }
    } catch (error) {
        console.error('Error:', error);
        feedbackMessage.className = 'feedback-message alert alert-danger';
        feedbackMessage.textContent = 'An error occurred while updating the category.';
        feedbackMessage.style.display = 'block';
    } finally {
        submitButton.disabled = false;
    }
});
