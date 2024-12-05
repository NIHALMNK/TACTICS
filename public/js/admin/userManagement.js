document.addEventListener('DOMContentLoaded', function () {
    // Fetch user data and render it dynamically
    async function fetchUserData() {
        try {
            const response = await fetch('/admin/api/userManagement');  // Modify as per your API route
            if (!response.ok) {
                throw new Error('Failed to fetch user data');
            }

            const users = await response.json();
            renderUserTable(users);  // Render users in the table

        } catch (error) {
            console.error('Error fetching users:', error);
            renderUserTable([]);  // In case of an error, render no users
        }
    }

    // Render the users into the table
    function renderUserTable(users) {
        const tableBody = document.querySelector('table tbody');
        tableBody.innerHTML = '';  // Clear the table first
    
        if (users.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center">No users available</td></tr>`;
            return;
        }
    
        users.forEach(user => {
            const row = document.createElement('tr');
            const createdAt = new Date(user.createdAt);
            const formattedDate = `${createdAt.getDate()}:${createdAt.getMonth() + 1}:${createdAt.getFullYear()}`;
            
            // Check if the user is an admin and hide the Ban button
            let banButtonHTML = '';
            if (user.role !== 'admin') {
                banButtonHTML = `<button data-id="${user.email}" class="btn ${user.isDeleted ? 'btn-success' : 'btn-danger'} btn-ban">
                                    ${user.isDeleted ? 'Unban' : 'Ban'}
                                 </button>`;
            } else {
                banButtonHTML = '<button class="btn btn-secondary" disabled>Cannot Ban Admin</button>';
            }
    
            row.innerHTML = `
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td>${formattedDate}</td>
                <td>${banButtonHTML}</td>
                <td><button data-id="${user.email}" class="btn btn-warning btn-view">View</button></td>
            `;
            tableBody.appendChild(row);
        });
    
        // Reattach event listeners to the new buttons
        attachEventListeners();
    }
    

    function attachEventListeners() {
        document.querySelectorAll('.btn-ban').forEach(button => {
            button.removeEventListener('click', banUserHandler);  // Remove old listener to avoid duplicates
            button.addEventListener('click', banUserHandler);  // Attach new listener
        });

        document.querySelectorAll('.btn-view').forEach(button => {
            button.removeEventListener('click', viewUserDetailsHandler);  // Remove old listener to avoid duplicates
            button.addEventListener('click', viewUserDetailsHandler);  // Attach new listener
        });
    }

    async function banUserHandler() {
        const email = this.getAttribute('data-id'); // Get the user's email from the data-id attribute
        try {
            const response = await fetch(`/admin/userManagement/ban?email=${email}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });

            const result = await response.json();
            
            // SweetAlert for success notification
            Swal.fire({
                title: 'Success!',
                text: result.message,
                icon: 'success',
                confirmButtonText: 'OK'
            });

            if (result.isDeleted) {
                this.textContent = 'Unban';
                this.classList.remove('btn-danger');
                this.classList.add('btn-success');
            } else {
                this.textContent = 'Ban';
                this.classList.remove('btn-success');
                this.classList.add('btn-danger');
            }

        } catch (error) {
            console.error('Error toggling ban status:', error.message);
            
            // SweetAlert for error notification
            Swal.fire({
                title: 'Error!',
                text: `Failed to toggle ban status: ${error.message}`,
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    }

    async function viewUserDetailsHandler() {
        const email = this.getAttribute('data-id');  // Get the user's email from the data-id attribute
        try {
            const response = await fetch(`/admin/userManagement/view?email=${email}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            const userDetails = await response.json();
    
            // Display user details
            document.querySelector('.userInfoView').innerHTML = `
                <h4>User Details</h4>
                <p><strong>Username:</strong> ${userDetails.username}</p>
                <p><strong>Email:</strong> ${userDetails.email}</p>
                <p><strong>Role:</strong> ${userDetails.role}</p>
                <p><strong>Join Date:</strong> ${userDetails.joinDate}</p>
                <p><strong>Status:</strong> ${userDetails.isDeleted ? 'Banned' : 'Active'}</p>
            `;
        } catch (error) {
            console.log('Error fetching user details:', error);
            
            // SweetAlert for error notification
            Swal.fire({
                title: 'Error!',
                text: 'Failed to retrieve user details.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    }
    
    // Call the fetchUserData function on page load to load users dynamically
    fetchUserData();
});
