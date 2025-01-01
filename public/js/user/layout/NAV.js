    async function updateCartBadge() {
        try {
            const response = await fetch('/cart/badge');
            const data = await response.json();
            const cartBadge = document.querySelector('.cart-badge');
            if (cartBadge) {
                cartBadge.textContent = data.itemCount || 0; // Update the badge count
            }
        } catch (err) {
            console.error('Failed to update cart badge:', err);
        }
    }

    // Call the function when the page loads
    document.addEventListener('DOMContentLoaded', updateCartBadge);
