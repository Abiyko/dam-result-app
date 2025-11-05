document.addEventListener('DOMContentLoaded', function() {
    const menuButton = document.getElementById('menu-icon');
    const body = document.body;

    menuButton.addEventListener('click', function() {
        body.classList.toggle('menu-open');
    });
});