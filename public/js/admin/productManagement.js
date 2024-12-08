// Delete Product Handler
document.querySelectorAll('.btn-delete').forEach(button => {
    button.addEventListener('click', function (e) {
        const productId = e.target.getAttribute('data-id');

        // Replace standard confirmation with SweetAlert
        Swal.fire({
            title: 'Are you sure?',
            text: 'You will be able to recover this product on view deleted products !',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel',
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed) {
                fetch(`/admin/productManagement/unlink`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ productId: productId })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        Swal.fire(
                            'Deleted!',
                            'The product has been deleted.',
                            'success'
                        ).then(() => {
                            window.location.reload();
                        });
                    } else {
                        Swal.fire(
                            'Error!',
                            'Could not delete the product.',
                            'error'
                        );
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    Swal.fire(
                        'Error!',
                        'An error occurred while deleting the product.',
                        'error'
                    );
                });
            }
        });
    });
});

// View Deleted Products (unchanged)
document.getElementById('btn-del-prod').addEventListener('click', () => {
    window.location.href = '/admin/productManagement/deleted';
});
