
$(".btn-recover").on("click", async function () {
    const productId = $(this).data("id");
    ("Product ID for recover:", productId); 
    try {
        const res = await fetch(`/admin/productManagement/recoverProducts/${productId}`, { method: "PATCH" });
        const result = await res.json();
        if (res.ok && result.success) {
            Swal.fire({
                title: 'Success!',
                text: 'Product has been successfully recovered.',
                icon: 'success',
                confirmButtonText: 'OK'
            }).then(() => location.reload());
        } else {
            Swal.fire({
                title: 'Error!',
                text: 'Failed to recover product. ' + result.message,
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    } catch (error) {
        console.error(error);
        Swal.fire({
            title: 'Error!',
            text: 'An error occurred while recovering the product.',
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
});

$(".btn-delete").on("click", async function() {
    try {
        const productId = $(this).data("id");
        if (!productId) {
            throw new Error("Product ID is missing");
        }
        console.log("Product ID for delete:", productId);

        const result = await Swal.fire({
            title: 'Are you sure?',
            text: 'This product will be permanently deleted!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6'
        });

        if (result.isConfirmed) {
            const response = await fetch(`/admin/productManagement/permanentDeleteProducts/${productId}`, {
                method: "DELETE",
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to delete product');
            }

            await Swal.fire({
                title: 'Deleted!',
                text: 'Product has been permanently deleted.',
                icon: 'success',
                confirmButtonText: 'OK'
            });

            location.reload();
        }
    } catch (error) {
        console.error('Delete operation failed:', error);
        await Swal.fire({
            title: 'Error!',
            text: error.message || 'An error occurred while deleting the product.',
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
});