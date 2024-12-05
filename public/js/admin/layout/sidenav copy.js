document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const content = document.getElementById('content');
    const sidebarToggle = document.getElementById('sidebarToggle');
    
    // Function to toggle sidebar state
    const toggleSidebar = () => {
        sidebar.classList.toggle('collapsed');
        content.classList.toggle('sidebar-collapsed');
    };

    // Add click event listener to the toggle button
    sidebarToggle.addEventListener('click', toggleSidebar);

    // Function to handle responsive behavior
    const handleResponsiveSidebar = () => {
        if (window.innerWidth <= 768) {
            sidebar.classList.add('collapsed'); // Collapse sidebar by default on mobile
            content.classList.add('sidebar-collapsed');
        } else {
            sidebar.classList.remove('collapsed');
            content.classList.remove('sidebar-collapsed');
        }
    };

    // Run on initial load and window resize
    window.addEventListener('resize', handleResponsiveSidebar);
    handleResponsiveSidebar();
});
