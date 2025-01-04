document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const sidebarLogo = sidebar.querySelector('.sidebar-logo');
    let isMobile = window.innerWidth <= 768;
    let isSidebarOpen = false;

    function toggleSidebar() {
        if (isMobile) {
            sidebar.classList.toggle('mobile-open');
            isSidebarOpen = sidebar.classList.contains('mobile-open');
        } else {
            sidebar.classList.toggle('collapsed');
        }
    }

    function handleResize() {
        const newIsMobile = window.innerWidth <= 768;
        
        if (newIsMobile !== isMobile) {
            isMobile = newIsMobile;
            
            if (isMobile) {
                sidebar.classList.remove('collapsed');
                sidebar.classList.remove('mobile-open');
                isSidebarOpen = false;
            }
        }
    }

    sidebarLogo.addEventListener('click', toggleSidebar);
    window.addEventListener('resize', handleResize);
});