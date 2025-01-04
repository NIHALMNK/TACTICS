
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

$(".btn-delete").on("click", async function () {
    const productId = $(this).data("id");
    ("Product ID for delete:", productId); 

    const result = await Swal.fire({
        title: 'Are you sure?',
        text: 'This product will be permanently deleted!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
        try {
            const res = await fetch(`/admin/productManagement/permanentDeleteProducts/${productId}`, { method: "DELETE" });
            const result = await res.json();
            if (res.ok && result.success) {
                Swal.fire({
                    title: 'Deleted!',
                    text: 'Product has been permanently deleted.',
                    icon: 'success',
                    confirmButtonText: 'OK'
                }).then(() => location.reload());
            } else {
                Swal.fire({
                    title: 'Error!',
                    text: 'Failed to delete product. ' + result.message,
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        } catch (error) {
            console.error(error);
            Swal.fire({
                title: 'Error!',
                text: 'An error occurred while deleting the product.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    }
});
