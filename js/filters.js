document.querySelectorAll('.tag').forEach(tag => {
    tag.addEventListener('click', () => {
        const category = tag.getAttribute('data-filter'); // Получаем значение категории
        const items = document.querySelectorAll('.item');

        // Показываем или скрываем элементы в зависимости от категории
        items.forEach(item => {
            if (category === 'all' || item.getAttribute('data-categories') === category) {
                item.style.display = 'block'; // Показываем элемент
            } else {
                item.style.display = 'none'; // Скрываем элемент
            }
        });
    });
});
