document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const content = document.getElementById('content');
    const sidebarToggle = document.getElementById('sidebarToggle');

    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        content.classList.toggle('sidebar-collapsed');
    });

    // Mobile menu handling
    function handleMobileMenu() {
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('collapsed');
            content.classList.remove('sidebar-collapsed');
        }
    }

    window.addEventListener('resize', handleMobileMenu);
    handleMobileMenu();
});