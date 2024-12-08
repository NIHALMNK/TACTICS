document.addEventListener('DOMContentLoaded', function () {
    let currentPage = 1;
    let totalPages = 1;

    // Fetch user data and render it dynamically
    async function fetchUserData(page = 1) {
        try {
            const response = await fetch(`/admin/api/userManagement?page=${page}`);
            if (!response.ok) {
                throw new Error('Failed to fetch user data');
            }

            const data = await response.json();
            currentPage = data.currentPage;
            totalPages = data.totalPages;

            renderUserTable(data.users);
            updatePaginationUI(currentPage, totalPages);

        } catch (error) {
            console.error('Error fetching users:', error);
            renderUserTable([]);
            updatePaginationUI(1, 1);
        }
    }

    function updatePaginationUI(current, total) {
        const paginationContainer = document.querySelector('.pagination');
        if (!paginationContainer) return;

        // Clear existing pagination
        paginationContainer.innerHTML = '';

        // Previous page button
        if (current > 1) {
            const prevLi = document.createElement('li');
            prevLi.className = 'page-item';
            const prevLink = document.createElement('a');
            prevLink.className = 'page-link';
            prevLink.href = `#page=${current - 1}`;
            prevLink.innerHTML = '&laquo;';
            prevLink.addEventListener('click', (e) => {
                e.preventDefault();
                fetchUserData(current - 1);
            });
            prevLi.appendChild(prevLink);
            paginationContainer.appendChild(prevLi);
        }

        // Page number buttons
        for (let i = 1; i <= total; i++) {
            // Only show first, last, and pages close to current page
            if (
                i === 1 || 
                i === total || 
                (i >= current - 2 && i <= current + 2)
            ) {
                const li = document.createElement('li');
                li.className = `page-item ${i === current ? 'active' : ''}`;
                const link = document.createElement('a');
                link.className = 'page-link';
                link.href = `#page=${i}`;
                link.textContent = i;
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    fetchUserData(i);
                });
                li.appendChild(link);
                paginationContainer.appendChild(li);
            }
        }

        // Next page button
        if (current < total) {
            const nextLi = document.createElement('li');
            nextLi.className = 'page-item';
            const nextLink = document.createElement('a');
            nextLink.className = 'page-link';
            nextLink.href = `#page=${current + 1}`;
            nextLink.innerHTML = '&raquo;';
            nextLink.addEventListener('click', (e) => {
                e.preventDefault();
                fetchUserData(current + 1);
            });
            nextLi.appendChild(nextLink);
            paginationContainer.appendChild(nextLi);
        }
    }

    // Modified renderUserTable to match your existing implementation
    function renderUserTable(users) {
        const tableBody = document.querySelector('table tbody');
        tableBody.innerHTML = ''; // Clear the table first
    
        // Filter out admins from the user list
        const nonAdminUsers = users.filter(user => user.role !== 'admin');
    
        if (nonAdminUsers.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center">No users available</td></tr>`;
            return;
        }
    
        nonAdminUsers.forEach(user => {
            const row = document.createElement('tr');
            const createdAt = new Date(user.createdAt);
            const formattedDate = `${createdAt.getDate()}:${createdAt.getMonth() + 1}:${createdAt.getFullYear()}`;
    
            let banButtonHTML = `<button data-id="${user.email}" class="btn ${user.isDeleted ? 'btn-success' : 'btn-danger'} btn-ban">
                                    ${user.isDeleted ? 'Unban' : 'Ban'}
                                 </button>`;
                                 
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
    

    // Initial load
    fetchUserData();
});