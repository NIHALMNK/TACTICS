$('.btn-recover, .btn-delete').on('click', async function (e) {
    e.preventDefault();

    const button = $(this);
    const action = button.hasClass('btn-recover') ? 'recover' : 'delete';
    const productId = button.data('id'); 
    const productName = button.closest('tr').find('td:first').text();

    if (!productId) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Product ID is missing. Please try again.',
        });
        return;
    }

    const confirmationResult = await Swal.fire({
        icon: action === 'recover' ? 'question' : 'warning',
        title: action === 'recover' ? 'Recover Product' : 'Permanently Delete Product',
        text: action === 'recover'
            ? `Are you sure you want to recover "${productName}"?`
            : `Are you sure you want to permanently delete "${productName}"? This action cannot be undone.`,
        showCancelButton: true,
        confirmButtonText: action === 'recover' ? 'Recover' : 'Delete',
        cancelButtonText: 'Cancel',
        reverseButtons: true,
    });

    if (!confirmationResult.isConfirmed) {
        return;
    }

    button.prop('disabled', true);
    button.find('.spinner-border').removeClass('d-none');

    const url = action === 'recover'
        ? `/admin/category/recoverCategory/${productId}`
        : `/admin/category/permanentDeleteCategory/${productId}`;

    try {
        const res = await fetch(url, {
            method: action === 'recover' ? 'PATCH' : 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!res.ok) {
            const errorMessage = await res.text();
            throw new Error(errorMessage || `HTTP Error: ${res.status}`);
        }

        const data = await res.json();

        if (data.success) {
            await Swal.fire({
                icon: 'success',
                title: action === 'recover' ? 'Recovered!' : 'Deleted!',
                text: action === 'recover'
                    ? `"${productName}" has been successfully recovered.`
                    : `"${productName}" has been permanently deleted.`,
            });

            if (action === 'delete') {
                button.closest('tr').remove(); 
            } else {
                window.location.reload(); 
            }
        } else {
            throw new Error(data.message || `Failed to ${action} the product.`);
        }
    } catch (error) {
        console.error(`Error during ${action} action:`, error);
        await Swal.fire({
            icon: 'error',
            title: 'Error',
            text: `An error occurred while trying to ${action} the product. ${error.message}`,
        });
    } finally {
        button.prop('disabled', false);
        button.find('.spinner-border').addClass('d-none');
    }
});
