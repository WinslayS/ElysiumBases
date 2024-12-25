document.addEventListener('DOMContentLoaded', async () => {
    const modal = document.getElementById('modal');
    const modalContent = modal.querySelector('.modal-content');
    const thumbnailsContainer = document.getElementById('thumbnailsContainer');
    const zoomSlider = document.getElementById('zoomSlider');
    const resetZoom = document.getElementById('resetZoom');
    const closeModal = document.getElementById('closeModal');

    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;
    let startX = 0, startY = 0;
    let currentImageIndex = 0;
    let imagesList = [];
    let layoutsData = [];
    let thumbnailData = {};
    let touchStartX = 0;
    let touchStartY = 0;
    let isTouchDragging = false;
    let lastTouchTime = 0;

    zoomSlider.addEventListener('input', (e) => {
        const value = zoomSlider.value;
        const min = zoomSlider.min;
        const max = zoomSlider.max;
    
        // Рассчитываем процент заполнения
        const fillPercent = ((value - min) / (max - min)) * 100;
    
        // Обновляем ширину заполненной части
        zoomSlider.style.setProperty('--slider-fill', `${fillPercent}%`);
    });
    const syncZoomSlider = () => {
        zoomSlider.value = scale.toFixed(1); // Синхронизация значения ползунка

        const fillPercent = ((scale - zoomSlider.min) / (zoomSlider.max - zoomSlider.min)) * 100;
        zoomSlider.style.setProperty('--slider-fill', `${fillPercent}%`);
    };
    // Сброс масштаба
    resetZoom.addEventListener('click', () => {
        // Переключаем между двумя состояниями масштаба
        scale = scale === 1 ? 2 : 1;
    
        // Сбрасываем смещения при уменьшении масштаба
        if (scale === 1) {
            offsetX = 0;
            offsetY = 0;
        }
    
        updateBackground();
        syncZoomSlider(); // Синхронизация ползунка
    });

    // Управление ползунком масштаба
    zoomSlider.addEventListener('input', (e) => {
        const newScale = parseFloat(e.target.value);
        const rect = modalContent.getBoundingClientRect();
        const centerX = rect.width / 2; // Центр контейнера
        const centerY = rect.height / 2;
    
        // Рассчитываем новые смещения для сохранения центра
        offsetX -= (centerX / rect.width) * (newScale - scale) * rect.width;
        offsetY -= (centerY / rect.height) * (newScale - scale) * rect.height;
    
        scale = newScale;
        updateBackground();
    });

    // Закрытие модального окна
    closeModal.addEventListener('click', () => {
        // Сбрасываем настройки масштабирования и смещений
        scale = 1;
        offsetX = 0;
        offsetY = 0;
    
        // Обновляем интерфейс
        updateBackground();
        syncZoomSlider(); // Синхронизация ползунка
    
        // Закрываем модальное окно
        modal.classList.remove('show');
        document.body.classList.remove('modal-open');
    });

    const constrainOffsets = () => {
        const containerWidth = modalContent.offsetWidth;
        const containerHeight = modalContent.offsetHeight - thumbnailsContainer.offsetHeight;
    
        // Размеры изображения с учетом масштаба
        const scaledWidth = containerWidth * scale;
        const scaledHeight = containerHeight * scale;
    
        // Ограничения смещений, чтобы изображение оставалось видимым
        const minOffsetX = Math.min(0, containerWidth - scaledWidth); // Левая граница
        const maxOffsetX = Math.max(0, containerWidth - scaledWidth); // Правая граница
    
        const minOffsetY = Math.min(0, containerHeight - scaledHeight); // Верхняя граница
        const maxOffsetY = Math.max(0, containerHeight - scaledHeight); // Нижняя граница
    
        // Если изображение меньше контейнера, оно должно быть центрировано
        if (scaledWidth < containerWidth) {
            offsetX = 0; // Центрирование по X
        } else {
            offsetX = Math.max(minOffsetX, Math.min(offsetX, maxOffsetX));
        }
    
        if (scaledHeight < containerHeight) {
            offsetY = 0; // Центрирование по Y
        } else {
            offsetY = Math.max(minOffsetY, Math.min(offsetY, maxOffsetY));
        }
    };
    
    const updateBackground = () => {
        constrainOffsets(); // Ограничиваем смещения
        modalContent.style.backgroundSize = `${scale * 100}%`;
        modalContent.style.backgroundPosition = `${offsetX}px ${offsetY}px`;
    };

    const showImage = (index) => {
        if (index < 0 || index >= imagesList.length) return;

        const fullImage = imagesList[index];
        currentImageIndex = index;

        const image = new Image();
        image.src = fullImage;

        scale = 1;
        offsetX = 0;
        offsetY = 0;

        image.onload = () => {
        const modalContent = document.querySelector('.modal-content');
        const previewArea = document.querySelector('.preview-area');

        // Устанавливаем размеры на основе соотношения сторон изображения
        const aspectRatio = image.width / image.height;
        const containerWidth = modalContent.offsetWidth;

        modalContent.style.height = `${containerWidth / aspectRatio}px`; // Устанавливаем высоту
        previewArea.style.height = 'auto'; // Высота адаптируется по содержимому

        modalContent.style.backgroundImage = `url(${fullImage})`;
        modalContent.style.backgroundRepeat = 'no-repeat';
        modalContent.style.backgroundPosition = 'center';
        modalContent.style.backgroundSize = 'contain';

        updateBackground();
        updateThumbnails();
        scrollToActiveThumbnail();
        syncZoomSlider(); // Синхронизация ползунка
    };
    };

    const showNextImage = () => {
        currentImageIndex = (currentImageIndex + 1) % imagesList.length; // Возвращаемся к первому изображению
        showImage(currentImageIndex);
        syncZoomSlider(); // Синхронизация ползунка
    };

    const showPreviousImage = () => {
        currentImageIndex = (currentImageIndex - 1 + imagesList.length) % imagesList.length; // Возвращаемся к последнему изображению
        showImage(currentImageIndex);
        syncZoomSlider(); // Синхронизация ползунка
    };

    const updateThumbnails = () => {
        const thumbnails = thumbnailsContainer.querySelectorAll('.thumbnail');
        thumbnails.forEach((thumbnail, index) => {
            if (index === currentImageIndex) {
                thumbnail.classList.add('active');
            } else {
                thumbnail.classList.remove('active');
            }
        });
    };

    const scrollToActiveThumbnail = () => {
        const activeThumbnail = thumbnailsContainer.querySelector('.thumbnail.active');
        if (activeThumbnail) {
            activeThumbnail.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center',
            });
        }
    };

    // Загрузка данных
    try {
        const layoutsResponse = await fetch('data/layouts.json');
        layoutsData = await layoutsResponse.json();

        const thumbnailsResponse = await fetch('data/thumbnailData.json');
        thumbnailData = await thumbnailsResponse.json();
    } catch (error) {
        console.error('Ошибка загрузки JSON:', error);
        return;
    }

    // Открытие изображения
    const images = document.querySelectorAll('.zoomable');
    images.forEach((image) => {
        image.addEventListener('click', () => {
            const imageId = image.dataset.id;
            imagesList = thumbnailData[imageId] || [];
            currentImageIndex = 0;

            if (imagesList.length > 0) {
                showImage(0);
                modal.classList.add('show');
                document.body.classList.add('modal-open');

                // Добавление миниатюр
                thumbnailsContainer.innerHTML = '';
                imagesList.forEach((src, index) => {
                    const thumbnail = document.createElement('img');
                    thumbnail.src = src;
                    thumbnail.classList.add('thumbnail');
                    if (index === 0) thumbnail.classList.add('active');
                    thumbnail.addEventListener('click', () => showImage(index));
                    thumbnailsContainer.appendChild(thumbnail);
                });
            } else {
                console.error('Изображения для ID не найдены:', imageId);
            }
        });
    });

    // Масштабирование
    modalContent.addEventListener('wheel', (e) => {
        e.preventDefault();
    
        const rect = modalContent.getBoundingClientRect();
        const cursorX = e.clientX - rect.left; // Позиция курсора относительно элемента
        const cursorY = e.clientY - rect.top;
    
        const prevScale = scale;
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        scale = Math.min(Math.max(scale + delta, 1), 3); // Ограничиваем масштаб
    
        // Рассчитываем новые смещения относительно курсора
        const deltaScale = scale - prevScale;
        offsetX -= cursorX * deltaScale;
        offsetY -= cursorY * deltaScale;
    
        updateBackground();
    
        // Синхронизация значения слайдера
        syncZoomSlider(); // Синхронизация ползунка
    });

    // Масштабирование по двойному клику
    modalContent.addEventListener('dblclick', (e) => {
        const rect = modalContent.getBoundingClientRect();
        const cursorX = e.clientX - rect.left; // Позиция курсора относительно элемента
        const cursorY = e.clientY - rect.top;

        const prevScale = scale;
        scale = scale === 1 ? 2 : 1;

            // Рассчитываем новые смещения для центрирования масштабирования на курсоре
            if (scale > prevScale) {
                const deltaScale = scale - prevScale;
                offsetX -= (cursorX / rect.width) * deltaScale * rect.width;
                offsetY -= (cursorY / rect.height) * deltaScale * rect.height;
            } else {
            // Возвращаем смещения к центру при уменьшении масштаба
                offsetX = 0;
                offsetY = 0;
            }

        constrainOffsets(); // Обновляем ограничения смещений
        updateBackground(); // Применяем изменения
        syncZoomSlider(); // Синхронизация ползунка
    });

    // Перетаскивание
    modalContent.addEventListener('mousedown', (e) => {
        // Предотвращаем перетаскивание, если клик был на ползунке
        if (e.target === zoomSlider || zoomSlider.contains(e.target)) {
            return;
        }
    
        e.preventDefault(); // Предотвращаем нежелательные действия
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        modalContent.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
    
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
    
        offsetX += dx;
        offsetY += dy;
    
        startX = e.clientX;
        startY = e.clientY;
    
        updateBackground();
    });

    window.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            modalContent.style.cursor = 'grab';
        }
    });
    window.addEventListener('mouseleave', () => {
        if (isDragging) {
            isDragging = false;
            modalContent.style.cursor = 'grab';
        }
    });

    // Переключение клавишами
    window.addEventListener('keydown', (e) => {
        if (modal.classList.contains('show')) {
            if (e.key === 'ArrowRight') showNextImage();
            if (e.key === 'ArrowLeft') showPreviousImage();
            if (e.key === 'Escape') {
                modal.classList.remove('show');
                document.body.classList.remove('modal-open');
            }
        }
    });

    // Свайпы для переключения
modalContent.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
        const currentTime = new Date().getTime();
        const timeSinceLastTouch = currentTime - lastTouchTime;

        if (timeSinceLastTouch < 300 && timeSinceLastTouch > 0) {
            // Это двойное касание
            const rect = modalContent.getBoundingClientRect();
            const touchX = e.touches[0].clientX - rect.left;
            const touchY = e.touches[0].clientY - rect.top;

            const prevScale = scale;
            scale = scale === 1 ? 2 : 1;

            // Рассчитываем новые смещения для центрирования масштабирования на точке касания
            if (scale > prevScale) {
                const deltaScale = scale - prevScale;
                offsetX -= (touchX / rect.width) * deltaScale * rect.width;
                offsetY -= (touchY / rect.height) * deltaScale * rect.height;
            } else {
                // Возвращаем смещения к центру при уменьшении масштаба
                offsetX = 0;
                offsetY = 0;
            }

            constrainOffsets(); // Обновляем ограничения смещений
            updateBackground(); // Применяем изменения
            syncZoomSlider(); // Синхронизация ползунка
        }

        lastTouchTime = currentTime; // Обновляем время последнего касания

        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        isTouchDragging = false; // Сбрасываем флаг
    }
});

    modalContent.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
    
        if (!isTouchDragging) {
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
    
            // Логика свайпа
            if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < 30) {
                if (deltaX < 0) {
                    showNextImage();
                } else {
                    showPreviousImage();
                }
    
                syncZoomSlider(); // Синхронизация ползунка
            }
        }
    
        isTouchDragging = false; // Сбрасываем флаг
    });
    
    modalContent.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1) {
            const touchX = e.touches[0].clientX;
            const touchY = e.touches[0].clientY;
    
            const dx = touchX - touchStartX;
            const dy = touchY - touchStartY;
    
            // Если движение горизонтальное, это свайп
            if (!isTouchDragging && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
                isTouchDragging = false; // Это свайп
            } else if (!isTouchDragging && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) {
                isTouchDragging = true; // Это перетаскивание
            }
    
            if (isTouchDragging) {
                // Проверяем, можно ли отменить событие
                if (e.cancelable) {
                    e.preventDefault(); // Блокируем прокрутку страницы
                }
    
                // Обновляем смещения
                offsetX += dx;
                offsetY += dy;
    
                touchStartX = touchX;
                touchStartY = touchY;
    
                updateBackground();
            }
        }
    });

    // Закрытие по клику на фон
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
            document.body.classList.remove('modal-open');
        }
    });
});
