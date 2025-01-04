document.addEventListener('DOMContentLoaded', () => {
  const editButtons = document.querySelectorAll('.edit-btn');
  const passwordModal = document.getElementById('passwordModal');
  const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');
  const updatePasswordBtn = document.getElementById('updatePasswordBtn');
  const doneButton = document.querySelector('.btn-custom');

  const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  const phonePattern = /^\d{10}$/;
  
  let nameChanged = false;
  let passwordChanged = false;
  let phoneChanged = false;

  editButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const field = e.currentTarget.dataset.field;

      if (field === 'password') {
        passwordModal.classList.add('show');
        return;
      }

      const valueElement = document.getElementById(`${field}Value`);
      if (valueElement.tagName === 'INPUT') return;

      const currentValue = valueElement.textContent;
      const inputValue = currentValue === 'Not Set' ? '' : currentValue;

      valueElement.outerHTML = `
        <input 
          type="${field === 'phone' ? 'tel' : 'text'}"
          class="profile-input" 
          id="${field}Value" 
          value="${inputValue}"
          ${field === 'phone' ? 'pattern="[0-9]{10}"' : ''}
          maxlength="${field === 'phone' ? '10' : '50'}"
        />
      `;

      const inputElement = document.getElementById(`${field}Value`);
      inputElement.focus();

      inputElement.addEventListener('blur', () => saveEdit(field, currentValue));
      inputElement.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') saveEdit(field, currentValue);
      });
    });
  });

  function saveEdit(field, oldValue) {
    const inputElement = document.getElementById(`${field}Value`);
    const newValue = inputElement.value.trim();

    if (newValue === oldValue) {
      inputElement.outerHTML = `
        <div class="profile-value" id="${field}Value">${oldValue}</div>
      `;
      return;
    }

    if (validateInput(field, newValue)) {
      const displayValue = field === 'phone' && !newValue ? 'Not Set' : newValue;
      
      inputElement.outerHTML = `
        <div class="profile-value" id="${field}Value">${displayValue}</div>
      `;

      if (field === 'name') nameChanged = true;
      if (field === 'phone') phoneChanged = true;
    } else {
      inputElement.outerHTML = `
        <div class="profile-value" id="${field}Value">${oldValue}</div>
      `;
    }
  }

  function validateInput(field, value) {
    switch (field) {
      case 'name':
        if (value.trim().length < 2) {
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'Name must be at least 2 characters long'
          });
          return false;
        }
        if (!/^[a-zA-Z\s]+$/.test(value)) {
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'Name can only contain letters and spaces'
          });
          return false;
        }
        return true;

      case 'phone':
        if (value === '') return true; 
        if (!phonePattern.test(value)) {
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'Please enter a valid 10-digit phone number'
          });
          return false;
        }
        return true;

      default:
        return true;
    }
  }

  updatePasswordBtn.addEventListener('click', () => {
    const currentPassword = document.getElementById('currentPassword');
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');

    ['currentPassword', 'newPassword', 'confirmPassword'].forEach(id => {
      document.getElementById(`${id}Error`).style.display = 'none';
    });

    let hasError = false;

    if (currentPassword.value.length === 0) {
      document.getElementById('currentPasswordError').textContent = 'Current password is required';
      document.getElementById('currentPasswordError').style.display = 'block';
      hasError = true;
    }

    if (!passwordPattern.test(newPassword.value)) {
      document.getElementById('newPasswordError').textContent = 'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character';
      document.getElementById('newPasswordError').style.display = 'block';
      hasError = true;
    }

    if (newPassword.value !== confirmPassword.value) {
      document.getElementById('confirmPasswordError').textContent = 'Passwords do not match';
      document.getElementById('confirmPasswordError').style.display = 'block';
      hasError = true;
    }

    if (!hasError) {
      fetch('/profile/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: currentPassword.value,
          newPassword: newPassword.value
        })
      })
      .then(response => response.json())
      .then(data => {
        if (data.message === "Password updated successfully") {
          document.getElementById('passwordValue').textContent = '********';
          passwordModal.classList.remove('show');

          currentPassword.value = '';
          newPassword.value = '';
          confirmPassword.value = '';

          passwordChanged = true;
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Password updated successfully'
          });
        } else {
          document.getElementById('currentPasswordError').textContent = data.message;
          document.getElementById('currentPasswordError').style.display = 'block';
          hasError = true;
        }
      })
      .catch(error => {
        console.error('Error:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'An error occurred while updating password'
        });
      });
    }
  });

  cancelPasswordBtn.addEventListener('click', () => {
    passwordModal.classList.remove('show');
    ['currentPassword', 'newPassword', 'confirmPassword'].forEach(id => {
      document.getElementById(id).value = '';
      document.getElementById(`${id}Error`).style.display = 'none';
    });
  });

  doneButton.addEventListener('click', () => {
    const updatedName = document.getElementById('nameValue').textContent;
    const updatedPhone = document.getElementById('phoneValue').textContent;

    if (nameChanged || passwordChanged || phoneChanged) {
      const updateData = {};

      if (nameChanged) updateData.name = updatedName;
      if (phoneChanged) updateData.phone = updatedPhone === 'Not Set' ? '' : updatedPhone;

      fetch('/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      })
      .then(response => response.json())
      .then(data => {
        if (data.message === "Profile updated successfully") {
          document.getElementById('nameValue').textContent = data.user.name;
          document.getElementById('phoneValue').textContent = data.user.phone || 'Not Set';

          nameChanged = false;
          passwordChanged = false;
          phoneChanged = false;

          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Profile updated successfully'
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: data.message
          });
        }
      })
      .catch(error => {
        console.error('Error:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'An error occurred while updating profile'
        });
      });
    } else {
      Swal.fire({
        icon: 'info',
        title: 'Info',
        text: 'No changes to save'
      });
    }
  });
});