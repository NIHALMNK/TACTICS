document.querySelectorAll('.unlist').forEach(button => {
    button.addEventListener('click', async function (e) {
        const categoryId = e.target.closest('.unlist').getAttribute('data-id');

        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "This will unlink the category!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, unlink it!'
        });

        if (result.isConfirmed) {
            try {
                const response = await fetch('/admin/category/unlink', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ categoryId })
                });

                if (!response.ok) throw new Error('Failed to unlink category');
                const data = await response.json();

                if (data.success) {
                    Swal.fire('Unlinked!', 'The category has been unlinked.', 'success');
                    window.location.reload(); 
                } else {
                    Swal.fire('Error', data.message || 'Error unlinking category.', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                Swal.fire('Error', 'An error occurred while unlinking the category.', 'error');
            }
        }
    });
});

// Navigation buttons
document.getElementById('btn-add-cat').addEventListener('click', () => {
    window.location.href = '/admin/category/add'; 
});

document.getElementById('btn-del-cat').addEventListener('click', () => {
    window.location.href = '/admin/category/del'; 
});

// Real-time search
const searchInput = document.querySelector('.search-box input');
searchInput.addEventListener('input', function () {
    const searchTerm = searchInput.value.toLowerCase();
    const rows = document.querySelectorAll('tbody tr');

    rows.forEach(row => {
        const categoryName = row.children[1].textContent.toLowerCase();
        if (categoryName.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
});
