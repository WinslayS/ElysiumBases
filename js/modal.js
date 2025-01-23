document.addEventListener('DOMContentLoaded', async () => {
    const modal = document.getElementById('modal');
    const modalContent = modal.querySelector('.modal-content');
    const thumbnailsContainer = document.getElementById('thumbnailsContainer');
    const zoomSlider = document.getElementById('zoomSlider');
    const resetZoom = document.getElementById('resetZoom');
    const closeModal = document.getElementById('closeModal');

    // ==============================
    // Переменные состояния
    // ==============================
    let scale = 1;           // Текущий масштаб
    let offsetX = 0;         // Смещение картинки по X
    let offsetY = 0;         // Смещение картинки по Y

    // Для pointer-событий
    let isDragging = false;  // Идёт ли перетаскивание (drag) картинки
    let startX = 0, startY = 0; // Начальные координаты pointer
    let hasMoved = false;        // Было ли реальное движение картинки
    let pointerDownTime = 0;     // Время последнего pointerdown для двойного нажатия

    // Для свайпов (лево/право)
    let pointerDownX = 0;   // Координата X в момент pointerdown (нужно для свайпа)
    let pointerDownY = 0;   // Координата Y в момент pointerdown

    // Текущий индекс и список изображений
    let currentImageIndex = 0;
    let imagesList = [];
    let layoutsData = [];
    let thumbnailData = {};

    // ==============================
    // Инициализация
    // ==============================

    try {
        const layoutsResponse = await fetch('data/layouts.json');
        layoutsData = await layoutsResponse.json();

        const thumbnailsResponse = await fetch('data/thumbnailData.json');
        thumbnailData = await thumbnailsResponse.json();
    } catch (error) {
        console.error('Ошибка загрузки JSON:', error);
        return;
    }

    // ==============================
    // Управление зумом: ползунок
    // ==============================
    zoomSlider.addEventListener('input', (e) => {
        const newScale = parseFloat(e.target.value);
        const rect = modalContent.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Сдвигаем offsets, чтобы «центр» оставался визуально на месте
        offsetX -= (centerX / rect.width) * (newScale - scale) * rect.width;
        offsetY -= (centerY / rect.height) * (newScale - scale) * rect.height;

        scale = newScale;
        updateBackground();
        syncZoomSlider();
    });

    // Кнопка сброса масштаба (переключаем 1x / 2x)
    resetZoom.addEventListener('click', () => {
        scale = (scale === 1) ? 2 : 1;
        if (scale === 1) {
            offsetX = 0;
            offsetY = 0;
        }
        updateBackground();
        syncZoomSlider();
    });

    // Синхронизация ползунка
    const syncZoomSlider = () => {
        zoomSlider.value = scale.toFixed(1);

        const fillPercent = ((scale - zoomSlider.min) / (zoomSlider.max - zoomSlider.min)) * 100;
        zoomSlider.style.setProperty('--slider-fill', `${fillPercent}%`);
    };

    // ==============================
    // Функции отображения картинки
    // ==============================

    const showImage = (index) => {
        if (index < 0 || index >= imagesList.length) return;
        currentImageIndex = index;

        const fullImage = imagesList[index];
        const image = new Image();
        image.src = fullImage;

        // При новой картинке сбрасываем масштаб
        scale = 1;
        offsetX = 0;
        offsetY = 0;

        image.onload = () => {
            const previewArea = document.querySelector('.preview-area');
            const aspectRatio = image.width / image.height;
            const containerWidth = modalContent.offsetWidth;

            // Подгоняем высоту под соотношение сторон
            modalContent.style.height = `${containerWidth / aspectRatio}px`;
            previewArea.style.height = 'auto';

            // Фоновая картинка в modalContent
            modalContent.style.backgroundImage = `url(${fullImage})`;
            modalContent.style.backgroundRepeat = 'no-repeat';
            modalContent.style.backgroundPosition = 'center';
            modalContent.style.backgroundSize = 'contain';

            updateBackground();
            updateThumbnails();
            scrollToActiveThumbnail();
            syncZoomSlider();
        };
    };

    // Следующая/предыдущая картинка
    const showNextImage = () => {
        currentImageIndex = (currentImageIndex + 1) % imagesList.length;
        showImage(currentImageIndex);
    };
    const showPreviousImage = () => {
        currentImageIndex = (currentImageIndex - 1 + imagesList.length) % imagesList.length;
        showImage(currentImageIndex);
    };

    // Обновить класс «active» на миниатюрах
    const updateThumbnails = () => {
        const thumbs = thumbnailsContainer.querySelectorAll('.thumbnail');
        thumbs.forEach((thumb, idx) => {
            if (idx === currentImageIndex) thumb.classList.add('active');
            else thumb.classList.remove('active');
        });
    };

    // Прокрутить к активной миниатюре
    const scrollToActiveThumbnail = () => {
        const activeThumb = thumbnailsContainer.querySelector('.thumbnail.active');
        if (activeThumb) {
            activeThumb.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center',
            });
        }
    };

    // ==============================
    // Работа с фоном (зум, смещения)
    // ==============================

    const constrainOffsets = () => {
        // Ширина/высота с учётом миниатюр
        const containerWidth = modalContent.offsetWidth;
        const containerHeight = modalContent.offsetHeight - thumbnailsContainer.offsetHeight;

        const scaledWidth = containerWidth * scale;
        const scaledHeight = containerHeight * scale;

        // Левая и правая границы
        const minOffsetX = Math.min(0, containerWidth - scaledWidth);
        const maxOffsetX = Math.max(0, containerWidth - scaledWidth);

        // Верхняя и нижняя границы
        const minOffsetY = Math.min(0, containerHeight - scaledHeight);
        const maxOffsetY = Math.max(0, containerHeight - scaledHeight);

        // Если картинка меньше контейнера по ширине/высоте - центрируем
        if (scaledWidth < containerWidth) offsetX = 0;
        else offsetX = Math.max(minOffsetX, Math.min(offsetX, maxOffsetX));

        if (scaledHeight < containerHeight) offsetY = 0;
        else offsetY = Math.max(minOffsetY, Math.min(offsetY, maxOffsetY));
    };

    const updateBackground = () => {
        constrainOffsets();
        modalContent.style.backgroundSize = `${scale * 100}%`;
        modalContent.style.backgroundPosition = `${offsetX}px ${offsetY}px`;
    };

    // ==============================
    // Открытие модалки
    // ==============================
    const images = document.querySelectorAll('.zoomable');
    images.forEach((img) => {
        img.addEventListener('click', () => {
            const imageId = img.dataset.id;
            imagesList = thumbnailData[imageId] || [];
            currentImageIndex = 0;

            if (imagesList.length > 0) {
                showImage(0);
                modal.classList.add('show');
                document.body.classList.add('modal-open');

                // Генерация миниатюр
                thumbnailsContainer.innerHTML = '';
                imagesList.forEach((src, idx) => {
                    const thumb = document.createElement('img');
                    thumb.src = src;
                    thumb.classList.add('thumbnail');
                    if (idx === 0) thumb.classList.add('active');
                    thumb.addEventListener('click', () => showImage(idx));
                    thumbnailsContainer.appendChild(thumb);
                });
            } else {
                console.error('Изображения для ID не найдены:', imageId);
            }
        });
    });

    // ==============================
    // Закрытие модалки
    // ==============================
    closeModal.addEventListener('click', () => {
        closeModalWindow();
    });

    const closeModalWindow = () => {
        scale = 1;
        offsetX = 0;
        offsetY = 0;
        updateBackground();
        syncZoomSlider();
        modal.classList.remove('show');
        document.body.classList.remove('modal-open');
    };

    // Клик по подложке
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModalWindow();
        }
    });

    // ==============================
    // Масштабирование колёсиком (Desktop)
    // ==============================
    modalContent.addEventListener('wheel', (e) => {
        e.preventDefault();
        const rect = modalContent.getBoundingClientRect();

        const cursorX = e.clientX - rect.left;
        const cursorY = e.clientY - rect.top;

        const prevScale = scale;
        const delta = (e.deltaY > 0) ? -0.1 : 0.1;
        scale = Math.min(Math.max(scale + delta, 1), 3);

        // Смещение относительно курсора
        const deltaScale = scale - prevScale;
        offsetX -= cursorX * deltaScale;
        offsetY -= cursorY * deltaScale;

        updateBackground();
        syncZoomSlider();
    }, { passive: false });

    // ==============================
    // Собственный "двойной клик" (Desktop + Mobile)
    // ==============================
    // Чтобы не зависеть от системного dblclick (который иногда задерживает),
    // будем сами отслеживать 2 клика/тапа за короткий интервал.
    // Мы делаем это в pointerdown (см. ниже).

    // ==============================
    // Pointer Events (и мышь, и тач)
    // ==============================

    modalContent.addEventListener('pointerdown', (e) => {
        // Проверяем, не кликнули ли по интерактивным элементам (кнопки, ползунок, миниатюры)
        if (e.target.closest('.control-button, #closeModal, #zoomSliderContainer, .thumbnail')) {
            // Не начинаем перетаскивание
            return;
        }

        // Сохраняем координаты нажатия (для свайпа)
        pointerDownX = e.clientX;
        pointerDownY = e.clientY;

        // Проверяем на "двойное нажатие" (и мышь, и тач)
        const now = Date.now();
        if (now - pointerDownTime < 300) {
            // Это второй клик/тап за короткий промежуток => двойное нажатие
            handleDoublePress(e);
        }
        pointerDownTime = now;

        // Начинаем потенциальное перетаскивание
        isDragging = true;
        hasMoved = false;  // пока что не двигались
        startX = e.clientX;
        startY = e.clientY;

        modalContent.setPointerCapture(e.pointerId);
        // Установим курсор grabbing (актуально для мыши)
        modalContent.style.cursor = 'grabbing';
    });

    modalContent.addEventListener('pointermove', (e) => {
        if (!isDragging) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
            hasMoved = true;
        }

        offsetX += dx;
        offsetY += dy;
        startX = e.clientX;
        startY = e.clientY;

        updateBackground();
    });

    modalContent.addEventListener('pointerup', (e) => {
        if (isDragging) {
            isDragging = false;
            modalContent.releasePointerCapture(e.pointerId);
            modalContent.style.cursor = 'grab';
        }

        // Если пользователь «не двигал» картинку (hasMoved=false),
        // то возможно это свайп (при scale===1) или просто клик
        if (!hasMoved && scale === 1) {
            const dx = e.clientX - pointerDownX;
            const dy = e.clientY - pointerDownY;

            // Проверка: свайп влево/вправо
            if (Math.abs(dx) > 50 && Math.abs(dy) < 30) {
                if (dx < 0) {
                    // свайп влево => следующее изображение
                    showNextImage();
                } else {
                    // свайп вправо => предыдущее
                    showPreviousImage();
                }
            }
        }
    });

    modalContent.addEventListener('pointercancel', (e) => {
        // Аналог pointerup, если событие отменили
        if (isDragging) {
            isDragging = false;
            modalContent.releasePointerCapture(e.pointerId);
            modalContent.style.cursor = 'grab';
        }
    });

    // Функция обработки двойного клика/тапа (своя, а не системная)
    function handleDoublePress(e) {
        const rect = modalContent.getBoundingClientRect();
        const cursorX = e.clientX - rect.left;
        const cursorY = e.clientY - rect.top;

        const prevScale = scale;
        scale = (scale === 1) ? 2 : 1;

        if (scale > prevScale) {
            // Увеличиваем относительно точки нажатия
            const deltaScale = scale - prevScale;
            offsetX -= (cursorX / rect.width) * deltaScale * rect.width;
            offsetY -= (cursorY / rect.height) * deltaScale * rect.height;
        } else {
            // Возвращаем в центр
            offsetX = 0;
            offsetY = 0;
        }

        updateBackground();
        syncZoomSlider();
    }

    // ==============================
    // Переключение клавишами (Desktop)
    // ==============================
    window.addEventListener('keydown', (e) => {
        if (modal.classList.contains('show')) {
            if (e.key === 'ArrowRight') {
                showNextImage();
            } else if (e.key === 'ArrowLeft') {
                showPreviousImage();
            } else if (e.key === 'Escape') {
                closeModalWindow();
            }
        }
    });
});
