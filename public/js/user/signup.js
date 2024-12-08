const message = document.getElementById("message").value;

if (message) {
  swal({
    title: message,
    text: "I will close in 2 seconds.",
    timer: 2000,
  });
}

    
    document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('signupForm');
    const inputs = {
        name: {
            element: document.getElementById('nameInput'),
            pattern: /^[A-Za-z\s]{2,}$/,
            errorMessage: 'Name must be at least 2 characters long and contain only letters.',
        },
        email: {
            element: document.getElementById('emailInput'),
            pattern: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
            errorMessage: 'Please enter a valid email address.',
        },
        password: {
            element: document.getElementById('passwordInput'),
            pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
            errorMessage: 'Password must be at least 8 characters, including uppercase, lowercase, number, and special character.',
        },
        phone: {
            element: document.getElementById('phoneInput'),
            pattern: /^\+?[0-9]{10,15}$/,
            errorMessage: 'Please enter a valid phone number (10-15 digits).',
        },
    };
    const termsCheckbox = document.getElementById('terms');
    const signupButton = document.querySelector('.btn-signup');
    const spinner = document.querySelector('.spinner-border');
    const signupText = document.querySelector('.signup-text');
    const successMessage = document.querySelector('.success-message');

    const passwordToggle = document.querySelector('.password-toggle');
    passwordToggle.addEventListener('click', () => {
        const isPasswordVisible = inputs.password.element.getAttribute('type') === 'password';
        inputs.password.element.setAttribute('type', isPasswordVisible ? 'text' : 'password');
        const icon = passwordToggle.querySelector('i');
        icon.classList.toggle('fa-eye', isPasswordVisible);
        icon.classList.toggle('fa-eye-slash', !isPasswordVisible);
    });

    const validateInput = (inputConfig) => {
        const { element, pattern, errorMessage } = inputConfig;
        const isValid = pattern.test(element.value);

        if (!isValid) {
            element.classList.add('is-invalid');
            element.nextElementSibling.textContent = errorMessage;
        } else {
            element.classList.remove('is-invalid');
            element.classList.add('is-valid');
            element.nextElementSibling.textContent = '';
        }

        return isValid;
    };

    Object.values(inputs).forEach(({ element, pattern, errorMessage }) => {
        element.addEventListener('input', () => validateInput({ element, pattern, errorMessage }));
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const areInputsValid = Object.values(inputs).every((inputConfig) =>
            validateInput(inputConfig)
        );
        const areTermsAccepted = termsCheckbox.checked;

        if (!areTermsAccepted) {
            Swal.fire({
                icon: 'error',
                title: 'Terms Not Accepted',
                text: 'You must accept the terms and conditions to sign up.',
                timer: 2000,
                timerProgressBar: true,
                showConfirmButton: false,
            });
        }

        if (areInputsValid && areTermsAccepted) {
            signupButton.disabled = true;
            spinner.classList.remove('d-none');
            signupText.textContent = 'Creating account...';

            setTimeout(() => {
                successMessage.style.display = 'block';

                setTimeout(() => {
                    form.reset();
                    Object.values(inputs).forEach(({ element }) => {
                        element.classList.remove('is-valid');
                    });
                    successMessage.style.display = 'none';
                    signupButton.disabled = false;
                    spinner.classList.add('d-none');
                    signupText.textContent = 'Sign Up';
                }, 1500);
            }, 1500);
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Invalid Input',
                text: 'Please ensure all fields are filled out correctly.',
                timer: 2000,
                timerProgressBar: true,
                showConfirmButton: false,
            });
        }
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
      
        const formData = new FormData(form);
        const payload = Object.fromEntries(formData);
      
        const response = await fetch('/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      
        const result = await response.json();
        if (!result.success) {
          Swal.fire({ icon: 'error', title: 'Error', text: result.message });
          return;
        }
      
        Swal.fire({ icon: 'success', title: 'OTP Sent', text: 'Check your email for the OTP' });
        document.getElementById('otpModal').style.display = 'block';
      });
      

});

