document.addEventListener('DOMContentLoaded', () => {
    const editButtons = document.querySelectorAll('.edit-btn');
    const passwordModal = document.getElementById('passwordModal');
    const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');
    const updatePasswordBtn = document.getElementById('updatePasswordBtn');
    const doneButton = document.querySelector('.btn-custom');
  
    let nameChanged = false;
    let passwordChanged = false;
  
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  
    function validateInput(field, value) {
      switch (field) {
        case 'name':
          // Example validations
          if (value.trim().length < 2) {
            alert('Name must be at least 2 characters long');
            return false;
          }
          if (!/^[a-zA-Z\s]+$/.test(value)) {
            alert('Name can only contain letters and spaces');
            return false;
          }
          return true;
  
        case 'password':
          // Validation handled in password modal
          return true;
  
        default:
          return true;
      }
    }
  
    // Edit button functionality
    editButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const field = e.currentTarget.dataset.field;
  
        // Special handling for password
        if (field === 'password') {
          passwordModal.classList.add('show');
          return;
        }
  
        const valueElement = document.getElementById(`${field}Value`);
  
        // Prevent multiple edit modes
        if (valueElement.tagName === 'INPUT') return;
  
        // Convert to input
        const currentValue = valueElement.textContent;
        valueElement.outerHTML = `
          <input 
            type="text" 
            class="profile-input" 
            id="${field}Value" 
            value="${currentValue}" 
            maxlength="50"
          />
        `;
  
        const inputElement = document.getElementById(`${field}Value`);
        inputElement.focus();
  
        // Save on blur or enter
        inputElement.addEventListener('blur', saveEdit);
        inputElement.addEventListener('keypress', (event) => {
          if (event.key === 'Enter') saveEdit(event);
        });
  
        function saveEdit(event) {
          const newValue = inputElement.value.trim();
          const oldValue = currentValue.trim();
  
          if (newValue !== oldValue) {
            if (validateInput(field, newValue)) {
              // Replace input with updated value
              inputElement.outerHTML = `
                <div class="profile-value" id="${field}Value">${newValue}</div>
              `;
  
              // Update reference to the new value element
              const updatedValueElement = document.getElementById(`${field}Value`);
  
              // Mark field as changed
              if (field === 'name') nameChanged = true;
            } else {
              // Revert to original value if validation fails
              inputElement.outerHTML = `
                <div class="profile-value" id="${field}Value">${currentValue}</div>
              `;
            }
          } else {
            // No changes, revert to original display
            inputElement.outerHTML = `
              <div class="profile-value" id="${field}Value">${currentValue}</div>
            `;
          }
        }
      });
    });
  
    // Password Modal Functionality
    updatePasswordBtn.addEventListener('click', () => {
      const currentPassword = document.getElementById('currentPassword');
      const newPassword = document.getElementById('newPassword');
      const confirmPassword = document.getElementById('confirmPassword');
  
      // Reset error states
      ['currentPassword', 'newPassword', 'confirmPassword'].forEach(id => {
        document.getElementById(`${id}Error`).style.display = 'none';
      });
  
      let hasError = false;
  
      // Validate current password length
      if (currentPassword.value.length === 0) {
        document.getElementById('currentPasswordError').textContent = 'Current password is required';
        document.getElementById('currentPasswordError').style.display = 'block';
        hasError = true;
      }
  
      // Validate new password with regex
      if (!passwordPattern.test(newPassword.value)) {
        document.getElementById('newPasswordError').textContent = 'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character';
        document.getElementById('newPasswordError').style.display = 'block';
        hasError = true;
      }
  
      // Validate password confirmation
      if (newPassword.value !== confirmPassword.value) {
        document.getElementById('confirmPasswordError').textContent = 'Passwords do not match';
        document.getElementById('confirmPasswordError').style.display = 'block';
        hasError = true;
      }
  
      // If no errors, update password
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
              document.getElementById('passwordValue').textContent = '******';
              passwordModal.classList.remove('show');
  
              // Reset input fields
              currentPassword.value = '';
              newPassword.value = '';
              confirmPassword.value = '';
  
              passwordChanged = true;
              alert('Password updated successfully');
            } else {
              alert(data.message);
            }
          })
          .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while updating password');
          });
      }
    });
  
    // Cancel Password Modal
    cancelPasswordBtn.addEventListener('click', () => {
      passwordModal.classList.remove('show');
      ['currentPassword', 'newPassword', 'confirmPassword'].forEach(id => {
        document.getElementById(id).value = '';
        document.getElementById(`${id}Error`).style.display = 'none';
      });
    });
  
    // Save Profile Changes
    doneButton.addEventListener('click', () => {
      const updatedName = document.getElementById('nameValue').textContent;
  
      if (nameChanged || passwordChanged) {
        const updateData = {};
  
        if (nameChanged) updateData.name = updatedName;
  
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
              // Update displayed values
              document.getElementById('nameValue').textContent = data.user.name;
  
              // Reset change flags
              nameChanged = false;
              passwordChanged = false;
  
              alert('Profile updated successfully');
            } else {
              alert(data.message);
            }
          })
          .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while updating profile');
          });
      } else {
        alert('No changes to save');
      }
    });
  });
  
  