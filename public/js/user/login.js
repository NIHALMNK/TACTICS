
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    const passwordToggle = document.querySelector('.password-toggle');
    const loginButton = document.querySelector('.btn-login');
    const spinner = document.querySelector('.spinner-border');
    const loginText = document.querySelector('.login-text');
    const successMessage = document.querySelector('.success-message');

    const emailPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    passwordToggle.addEventListener('click', () => {
        const isPasswordVisible = passwordInput.getAttribute('type') === 'password';
        passwordInput.setAttribute('type', isPasswordVisible ? 'text' : 'password');
        const icon = passwordToggle.querySelector('i');
        icon.classList.toggle('fa-eye', isPasswordVisible);
        icon.classList.toggle('fa-eye-slash', !isPasswordVisible);
    });

    const validateInput = (input, pattern, errorMessage) => {
        if (!pattern.test(input.value)) {
            input.classList.add('is-invalid');
            input.nextElementSibling.textContent = errorMessage;
        } else {
            input.classList.remove('is-invalid');
            input.classList.add('is-valid');
            input.nextElementSibling.textContent = '';
        }
    };

    emailInput.addEventListener('input', () => {
        validateInput(emailInput, emailPattern, 'Please enter a valid email address.');
    });

    passwordInput.addEventListener('input', () => {
        validateInput(passwordInput, passwordPattern);
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const isEmailValid = emailPattern.test(emailInput.value);
        const isPasswordValid = passwordPattern.test(passwordInput.value);

        if (!isPasswordValid) {
            
            Swal.fire({
                icon: 'error',
                title: 'Invalid Password',
                text: 'Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a digit, and a special character.',
                timer: 10000,
                timerProgressBar: true,
                showConfirmButton: false,
            });
            return; 
        }

        if (isEmailValid && isPasswordValid) {
            form.classList.add('was-validated');

            loginButton.disabled = true;
            spinner.classList.remove('d-none');
            loginText.textContent = 'Signing in...';

            setTimeout(() => {
                successMessage.style.display = 'block';

                setTimeout(() => {
                    form.reset();
                    emailInput.classList.remove('is-valid');
                    passwordInput.classList.remove('is-valid');
                    form.classList.remove('was-validated');
                    successMessage.style.display = 'none';
                    loginButton.disabled = false;
                    spinner.classList.add('d-none');
                    loginText.textContent = 'Sign In';
                }, 1500);
            }, 1500);
        } else {
            form.classList.add('was-validated');
            if (!isEmailValid) {
                validateInput(emailInput, emailPattern);
            }
        }
    });
});
