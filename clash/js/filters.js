const tags = document.querySelectorAll('.tag');
const items = document.querySelectorAll('.item');
tags.forEach(tag => {
    tag.addEventListener('click', () => {
        const filter = tag.dataset.filter;
        items.forEach(item => {
            const categories = item.dataset.categories.split(',');
            if (filter === 'all' || categories.includes(filter)) {
                item.style.display = 'block'; // Показать элемент
            } else {
                item.style.display = 'none'; // Скрыть элемент
            }
        });
    });
});