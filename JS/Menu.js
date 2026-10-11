// Actualizar contador badge al cargar la página
function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalCount = cart.reduce((acc, item) => acc + item.cantidad, 0);
    const badge = document.getElementById('cartCount');
    if (badge) {
        badge.textContent = totalCount;
    }
}

// Función para agregar al carrito
function addCart(button) {
    const card = button.closest('.food-card');
    const title = card.querySelector('.food-title').textContent.trim();
    const desc = card.querySelector('.food-desc').textContent.trim();
    const priceText = card.querySelector('.food-price').textContent.trim();
    const price = parseFloat(priceText.replace('S/', '').trim());
    const img = card.querySelector('.card-img-wrapper img').src;

    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    // Verificar si el plato ya fue agregado previamente
    const existingIndex = cart.findIndex(item => item.title === title);

    if (existingIndex > -1) {
        cart[existingIndex].cantidad += 1;
    } else {
        cart.push({ title, desc, price, img, cantidad: 1 });
    }

    // Guardar en localStorage
    localStorage.setItem('cart', JSON.stringify(cart));

    // Actualizar el número del carrito en la interfaz
    updateCartBadge();
}

document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();

    const categoryButtons = document.querySelectorAll('.category-btn');
    const foodCards = document.querySelectorAll('.food-card');
    const searchInput = document.getElementById('searchInput');

    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const selectedCategory = button.getAttribute('data-category');

            foodCards.forEach(card => {
                const cardCategory = card.getAttribute('data-category');

                if (selectedCategory === 'todos' || cardCategory === selectedCategory) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();

        foodCards.forEach(card => {
            const title = card.querySelector('.food-title').textContent.toLowerCase();
            const desc = card.querySelector('.food-desc').textContent.toLowerCase();

            if (title.includes(searchTerm) || desc.includes(searchTerm)) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    });
});