document.addEventListener('layoutsRendered', async () => {
    const modal = document.getElementById('modal');
    const modalImage = document.getElementById('modalImage');
    const thumbnailsContainer = document.getElementById('thumbnailsContainer');

    if (!modal || !modalImage || !thumbnailsContainer) {
        console.error('Элементы модального окна не найдены.');
        return;
    }

    // Загружаем данные миниатюр
    let thumbnailData = {};
    try {
        const response = await fetch('data/thumbnailData.json');
        thumbnailData = await response.json();
    } catch (error) {
        console.error('Ошибка загрузки данных миниатюр:', error);
        return;
    }

    // Ищем элементы с классом "zoomable"
    const images = document.querySelectorAll('.zoomable');

    if (!images.length) {
        console.error('Нет изображений с классом zoomable.');
        return;
    }

    // Открытие изображения в модальном окне
    images.forEach(image => {
        image.addEventListener('click', () => {
            const imageId = image.dataset.id;
            modalImage.src = image.src;
            modal.classList.add('show');
            document.body.classList.add('modal-open'); // Добавить эффект размытия и затемнения

            // Очистка контейнера миниатюр
            thumbnailsContainer.innerHTML = '';

            // Добавление миниатюр
            if (thumbnailData[imageId]) {
                thumbnailData[imageId].forEach(src => {
                    const thumbnail = document.createElement('img');
                    thumbnail.src = src;
                    thumbnail.classList.add('thumbnail');
                    thumbnail.alt = 'Миниатюра';
                    thumbnail.addEventListener('click', () => {
                        modalImage.src = src; // Меняем изображение
                    });
                    thumbnailsContainer.appendChild(thumbnail);
                });
            }
        });
    });

    // Закрытие модального окна
    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target === modalImage) {
            modal.classList.remove('show');
            modalImage.src = '';
            thumbnailsContainer.innerHTML = ''; // Очистка миниатюр при закрытии
            document.body.classList.remove('modal-open'); // Убрать эффект размытия и затемнения
        }
    });
});
