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

document.getElementById('btn-add-cat').addEventListener('click', () => {
    window.location.href = '/admin/category/add'; 
});

document.getElementById('btn-del-cat').addEventListener('click', () => {
    window.location.href = '/admin/category/del'; 
});

const searchInput = document.querySelector('.search-box input');
searchInput.addEventListener('input', function () {
    const searchTerm = searchInput.value.toLowerCase();
    const rows = document.querySelectorAll('tbody tr');
    let visibleRowCount = 0;

    rows.forEach(row => {
        const categoryName = row.children[1].textContent.toLowerCase();
        if (categoryName.includes(searchTerm)) {
            row.style.display = '';
            visibleRowCount++;
        } else {
            row.style.display = 'none';
        }
    });

    const paginationContainer = document.querySelector('.pagination-container');
    if (paginationContainer) {
        paginationContainer.style.display = visibleRowCount > 0 ? 'block' : 'none';
    }
});


// Keep all your existing code and add this below:

// Offer button handlers
document.querySelectorAll('.add-offer').forEach(button => {
    button.addEventListener('click', async function(e) {
        const categoryId = e.target.getAttribute('data-id');
        
        const { value: offerPercentage } = await Swal.fire({
            title: 'Add Category Offer',
            input: 'number',
            inputLabel: 'Offer Percentage',
            inputPlaceholder: 'Enter offer percentage',
            inputAttributes: {
                min: '0',
                max: '100',
                step: '1'
            },
            showCancelButton: true,
            inputValidator: (value) => {
                if (!value) {
                    return 'Please enter an offer percentage';
                }
                if (value < 0 || value > 100) {
                    return 'Offer percentage must be between 0 and 100';
                }
            }
        });

        if (offerPercentage) {
            try {
                const response = await fetch('/admin/category/add-offer', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ categoryId, offerPercentage })
                });

                if (!response.ok) throw new Error('Failed to add offer');
                const data = await response.json();

                if (data.success) {
                  await  Swal.fire('Success!', 'Offer has been added.', 'success');
                    window.location.reload();
                } else {
                  await  Swal.fire('Error', data.message || 'Error adding offer.', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
               await Swal.fire('Error', 'An error occurred while adding the offer.', 'error');
            }
        }
    });
});

document.querySelectorAll('.remove-offer').forEach(button => {
    button.addEventListener('click', async function(e) {
        const categoryId = e.target.getAttribute('data-id');
        const currentOffer = e.target.getAttribute('data-offer');

        const result = await Swal.fire({
            title: 'Remove Offer?',
            text: `Are you sure you want to remove the ${currentOffer}% offer?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, remove it!'
        });

        if (result.isConfirmed) {
            try {
                const response = await fetch('/admin/category/remove-offer', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ categoryId })
                });

                if (!response.ok) throw new Error('Failed to remove offer');
                const data = await response.json();

                if (data.success) {
                   await Swal.fire('Removed!', 'The offer has been removed.', 'success');
                    window.location.reload();
                } else {
                   await Swal.fire('Error', data.message || 'Error removing offer.', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
              await  Swal.fire('Error', 'An error occurred while removing the offer.', 'error');
            }
        }
    });
});
