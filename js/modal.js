document.addEventListener('DOMContentLoaded', async () => {
    const modal = document.getElementById('modal');
    const modalContent = modal.querySelector('.modal-content');
    // (!!! ВАЖНО) берем отдельный элемент для картинки:
    const imageStage = modalContent.querySelector('.image-stage');
    
    const thumbnailsContainer = document.getElementById('thumbnailsContainer');
    const zoomSlider = document.getElementById('zoomSlider');
    const resetZoom = document.getElementById('resetZoom');
    const closeModal = document.getElementById('closeModal');

    // ==============================
    // Переменные состояния
    // ==============================
    let scale = 1;           
    let offsetX = 0;         // смещение фоновой картинки
    let offsetY = 0;         
    
    // "drag" картинки при scale>1
    let isDragging = false;
    let startX = 0, startY = 0; 

    // Для свайпа (при scale=1)
    let isPotentialSwipe = false;
    let isHorizontalSwipe = false;
    let isVerticalSwipe = false;
    let swipeStartX = 0;
    let swipeStartY = 0;
    const SWIPE_THRESHOLD = 80; 
    const SWIPE_CLOSE_THRESHOLD = 80; 
    const SWIPE_DEADZONE = 10; 

    let clickCount = 0;
    let doubleClickTimer = null;
    const DOUBLE_CLICK_DELAY = 300;

    // Pinch
    let pointers = [];
    let startPinchDist = 0; 
    let startPinchScale = 1; 
    let startPinchCenter = { x: 0, y: 0 };

    // Текущий индекс и список изображений
    let currentImageIndex = 0;
    let imagesList = [];
    let layoutsData = [];
    let thumbnailData = {};

    // ==============================
    // Загрузка JSON (пример)
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
    // Ползунок зума
    // ==============================
    zoomSlider.addEventListener('input', (e) => {
        const newScale = parseFloat(e.target.value);
        applyZoomCenterPreserving(newScale);
    });

    resetZoom.addEventListener('click', () => {
        let newScale = (scale === 1) ? 2 : 1;
        if (newScale === 1) {
            offsetX = 0;
            offsetY = 0;
        }
        applyZoomCenterPreserving(newScale);
    });

    // Задать scale так, чтобы центр зума не "прыгал"
    function applyZoomCenterPreserving(newScale, centerX, centerY) {
        const rect = imageStage.getBoundingClientRect(); 
        // (!!! берём размеры imageStage, а не modalContent)

        if (centerX === undefined || centerY === undefined) {
            centerX = rect.width / 2;
            centerY = rect.height / 2;
        }

        const deltaScale = newScale - scale;
        offsetX -= (centerX / rect.width) * deltaScale * rect.width;
        offsetY -= (centerY / rect.height) * deltaScale * rect.height;

        scale = Math.max(1, Math.min(newScale, 3));
        updateBackground();
        syncZoomSlider();
    }

    function syncZoomSlider() {
        zoomSlider.value = scale.toFixed(1);
        const fillPercent = ((scale - zoomSlider.min) / (zoomSlider.max - zoomSlider.min)) * 100;
        zoomSlider.style.setProperty('--slider-fill', `${fillPercent}%`);
    }

    // ==============================
    // Функции отображения картинки
    // ==============================
    function showImage(index) {
        if (index < 0 || index >= imagesList.length) return;
        currentImageIndex = index;

        // Сбрасываем масштаб
        scale = 1;
        offsetX = 0;
        offsetY = 0;

        // Старый фон убираем
        imageStage.style.backgroundImage = 'none';
        modalContent.classList.add('loading');

        const fullImage = imagesList[index];
        const image = new Image();
        image.src = fullImage;

        image.onload = () => {
            modalContent.classList.remove('loading');

            // подгоняем высоту modalContent
            const aspectRatio = image.width / image.height;
            const containerWidth = modalContent.offsetWidth;
            modalContent.style.height = `${containerWidth / aspectRatio}px`;
            const previewArea = modalContent.querySelector('.preview-area');
            if (previewArea) previewArea.style.height = 'auto';

            // (!!! ВАЖНО) ставим фон для imageStage, а не для modalContent
            imageStage.style.backgroundImage = `url(${fullImage})`;
            imageStage.style.backgroundPosition = 'center';
            imageStage.style.backgroundSize = 'contain';
            imageStage.style.backgroundRepeat = 'no-repeat';

            updateBackground();
            updateThumbnails();
            scrollToActiveThumbnail();
            syncZoomSlider();
        };

        image.onerror = () => {
            console.error("Не удалось загрузить:", fullImage);
            modalContent.classList.remove('loading');
        };
    }

    function showNextImage() {
        currentImageIndex = (currentImageIndex + 1) % imagesList.length;
        showImage(currentImageIndex);
    }
    function showPreviousImage() {
        currentImageIndex = (currentImageIndex - 1 + imagesList.length) % imagesList.length;
        showImage(currentImageIndex);
    }

    function updateThumbnails() {
        const thumbs = thumbnailsContainer.querySelectorAll('.thumbnail');
        thumbs.forEach((thumb, idx) => {
            if (idx === currentImageIndex) thumb.classList.add('active');
            else thumb.classList.remove('active');
        });
    }

    function scrollToActiveThumbnail() {
        const activeThumb = thumbnailsContainer.querySelector('.thumbnail.active');
        if (activeThumb) {
            activeThumb.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center',
            });
        }
    }

    // ==============================
    // Работа с фоном (зум, смещения)
    // ==============================
    function constrainOffsets() {
        const containerWidth = imageStage.offsetWidth; 
        const containerHeight = imageStage.offsetHeight;

        const scaledWidth = containerWidth * scale;
        const scaledHeight = containerHeight * scale;

        const minOffsetX = Math.min(0, containerWidth - scaledWidth);
        const maxOffsetX = Math.max(0, containerWidth - scaledWidth);
        if (scaledWidth < containerWidth) offsetX = 0;
        else offsetX = Math.max(minOffsetX, Math.min(offsetX, maxOffsetX));

        const minOffsetY = Math.min(0, containerHeight - scaledHeight);
        const maxOffsetY = Math.max(0, containerHeight - scaledHeight);
        if (scaledHeight < containerHeight) offsetY = 0;
        else offsetY = Math.max(minOffsetY, Math.min(offsetY, maxOffsetY));
    }

    function updateBackground() {
        constrainOffsets();
        // (!!! ВАЖНО) Применяем масштаб и позицию на imageStage
        imageStage.style.backgroundSize = `${scale * 100}%`;
        imageStage.style.backgroundPosition = `${offsetX}px ${offsetY}px`;
    }

    // ==============================
    // Открытие/закрытие модалки
    // ==============================
    const images = document.querySelectorAll('.zoomable');
    images.forEach((img) => {
        img.addEventListener('click', () => {
            const imageId = img.dataset.id;
            imagesList = thumbnailData[imageId] || [];
            if (imagesList.length > 0) {
                showImage(0);
                modal.classList.add('show');
                document.body.classList.add('modal-open');

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
                console.error('Нет изображений для ID:', imageId);
            }
        });
    });

    closeModal.addEventListener('click', closeModalWindow);

    function closeModalWindow() {
        scale = 1;
        offsetX = 0;
        offsetY = 0;
        imageStage.style.backgroundImage = 'none';
        modalContent.classList.remove('loading');

        // Сброс анимации
        modalContent.style.transition = 'none';
        modalContent.style.transform = 'translateY(0)';
        modalContent.style.opacity = '1';

        updateBackground();
        syncZoomSlider();
        modal.classList.remove('show');
        document.body.classList.remove('modal-open');
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModalWindow();
        }
    });

    // ==============================
    // Масштабирование колёсиком
    // ==============================
    imageStage.addEventListener('wheel', (e) => {
        e.preventDefault();
        const rect = imageStage.getBoundingClientRect();

        const cursorX = e.clientX - rect.left;
        const cursorY = e.clientY - rect.top;

        const prevScale = scale;
        const delta = (e.deltaY > 0) ? -0.1 : 0.1;
        let newScale = scale + delta;
        newScale = Math.max(1, Math.min(newScale, 3));

        if (Math.abs(newScale - prevScale) < 0.00001) {
            return;
        }

        const deltaScale = newScale - prevScale;
        offsetX -= cursorX * deltaScale;
        offsetY -= cursorY * deltaScale;

        scale = newScale;
        updateBackground();
        syncZoomSlider();
    }, { passive: false });

    // ==============================
    // Pointer Events
    // ==============================
    imageStage.addEventListener('pointerdown', onPointerDown);
    imageStage.addEventListener('pointermove', onPointerMove);
    imageStage.addEventListener('pointerup', onPointerUp);
    imageStage.addEventListener('pointercancel', onPointerCancel);

    // Мы слушаем на imageStage для зума, но 
    // для вертикального свайпа закрытия (движем modalContent) 
    // всё равно обрабатываем те же события.

    function onPointerDown(e) {
        // Если клик по кнопкам и т.п., не начинаем свайп
        if (e.target.closest('.control-button, #closeModal, #zoomSliderContainer, .thumbnail')) {
            return;
        }
        imageStage.setPointerCapture(e.pointerId);

        pointers.push({ id: e.pointerId, x: e.clientX, y: e.clientY });
        if (pointers.length === 2) {
            startPinchDist = getPinchDistance(pointers[0], pointers[1]);
            startPinchScale = scale;
            startPinchCenter = getPinchCenter(pointers[0], pointers[1]);
        }

        // Логика doubleTap
        clickCount++;
        if (clickCount === 1) {
            doubleClickTimer = setTimeout(() => {
                clickCount = 0;
            }, DOUBLE_CLICK_DELAY);
        } else if (clickCount === 2) {
            clearTimeout(doubleClickTimer);
            clickCount = 0;
            handleDoublePress(e);
        }

        if (pointers.length === 1) {
            startX = e.clientX;
            startY = e.clientY;

            if (scale > 1) {
                isDragging = true;
                isPotentialSwipe = false;
            } else {
                isDragging = false;
                isPotentialSwipe = true;
                isHorizontalSwipe = false;
                isVerticalSwipe = false;
                swipeStartX = e.clientX;
                swipeStartY = e.clientY;
                // Сброс transform, на случай если остался после предыдущей анимации
                imageStage.style.transition = 'none';
                imageStage.style.transform = 'translateX(0)';
                modalContent.style.transition = 'none';
                modalContent.style.transform = 'translateY(0)';
                modalContent.style.opacity = '1';
            }
        }
    }

    function onPointerMove(e) {
        // Обновить coords для pinch
        for (let i = 0; i < pointers.length; i++) {
            if (pointers[i].id === e.pointerId) {
                pointers[i].x = e.clientX;
                pointers[i].y = e.clientY;
                break;
            }
        }

        if (pointers.length === 2) {
            const newDist = getPinchDistance(pointers[0], pointers[1]);
            const pinchCenter = getPinchCenter(pointers[0], pointers[1]);
            let pinchRatio = newDist / startPinchDist;
            let newScale = startPinchScale * pinchRatio;
            applyZoomAroundPoint(newScale, pinchCenter.x, pinchCenter.y, startPinchCenter);
            return;
        }

        if (isDragging) {
            // Перетаскивание фоновой картинки
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            offsetX += dx;
            offsetY += dy;
            startX = e.clientX;
            startY = e.clientY;
            updateBackground();
        }
        else if (isPotentialSwipe) {
            const dx = e.clientX - swipeStartX;
            const dy = e.clientY - swipeStartY;

            if (!isHorizontalSwipe && !isVerticalSwipe) {
                if (Math.abs(dx) > SWIPE_DEADZONE || Math.abs(dy) > SWIPE_DEADZONE) {
                    if (Math.abs(dx) > Math.abs(dy)) {
                        isHorizontalSwipe = true;
                    } else {
                        isVerticalSwipe = true;
                    }
                }
            }

            // Горизонтальный свайп => двигаем imageStage по X
            if (isHorizontalSwipe) {
                imageStage.style.transform = `translateX(${dx}px)`;
            }
            // Вертикальный свайп => двигаем modalContent (и можно уменьшать opacity)
            else if (isVerticalSwipe) {
                // Для наглядности параллельно меняем непрозрачность 
                // (чем дальше тянем, тем сильнее исчезает)
                const absDY = Math.abs(dy);
                const maxDist = 300; 
                let newOpacity = 1 - (absDY / maxDist);
                if (newOpacity < 0) newOpacity = 0;
                modalContent.style.transform = `translateY(${dy}px)`;
                modalContent.style.opacity = newOpacity.toString();
            }
        }
    }

    function onPointerUp(e) {
        imageStage.releasePointerCapture(e.pointerId);
        pointers = pointers.filter(p => p.id !== e.pointerId);

        if (pointers.length < 2) {
            startPinchDist = 0;
        }

        if (isDragging) {
            isDragging = false;
        }
        else if (isPotentialSwipe) {
            const dx = e.clientX - swipeStartX;
            const dy = e.clientY - swipeStartY;
            if (isHorizontalSwipe) {
                finishHorizontalSwipe(dx);
            } else if (isVerticalSwipe) {
                finishVerticalSwipe(dy);
            }

            isPotentialSwipe = false;
            isHorizontalSwipe = false;
            isVerticalSwipe = false;
        }
    }

    function onPointerCancel(e) {
        imageStage.releasePointerCapture(e.pointerId);
        pointers = pointers.filter(p => p.id !== e.pointerId);
        isDragging = false;
        isPotentialSwipe = false;
        isHorizontalSwipe = false;
        isVerticalSwipe = false;
    }

    // ==============================
    // Завершаем свайпы
    // ==============================
    function finishHorizontalSwipe(dx) {
        imageStage.style.transition = 'transform 0.3s ease';

        if (dx < -SWIPE_THRESHOLD) {
            // Уходим влево
            imageStage.style.transform = 'translateX(-100%)';
            imageStage.addEventListener('transitionend', function afterLeft() {
                imageStage.removeEventListener('transitionend', afterLeft);
                showNextImage();
                // Ставим сразу справа
                imageStage.style.transition = 'none';
                imageStage.style.transform = 'translateX(100%)';
                requestAnimationFrame(() => {
                    // Потом за анимационный кадр возвращаем в центр
                    imageStage.style.transition = 'transform 0.3s ease';
                    imageStage.style.transform = 'translateX(0)';
                });
            });
        }
        else if (dx > SWIPE_THRESHOLD) {
            // Уходим вправо
            imageStage.style.transform = 'translateX(100%)';
            imageStage.addEventListener('transitionend', function afterRight() {
                imageStage.removeEventListener('transitionend', afterRight);
                showPreviousImage();
                imageStage.style.transition = 'none';
                imageStage.style.transform = 'translateX(-100%)';
                requestAnimationFrame(() => {
                    imageStage.style.transition = 'transform 0.3s ease';
                    imageStage.style.transform = 'translateX(0)';
                });
            });
        }
        else {
            // Возвращаем назад
            imageStage.style.transform = 'translateX(0)';
        }
    }

    function finishVerticalSwipe(dy) {
        modalContent.style.transition = 'transform 0.3s ease, opacity 0.3s ease';

        // Свайп вниз
        if (dy > SWIPE_CLOSE_THRESHOLD) {
            modalContent.style.transform = 'translateY(100%)';
            modalContent.style.opacity = '0'; 
            modalContent.addEventListener('transitionend', function _closeDown() {
                modalContent.removeEventListener('transitionend', _closeDown);
                closeModalWindow();
            });
        }
        // Свайп вверх
        else if (dy < -SWIPE_CLOSE_THRESHOLD) {
            modalContent.style.transform = 'translateY(-100%)';
            modalContent.style.opacity = '0';
            modalContent.addEventListener('transitionend', function _closeUp() {
                modalContent.removeEventListener('transitionend', _closeUp);
                closeModalWindow();
            });
        }
        // Не дотянули
        else {
            // Возвращаемся назад
            modalContent.style.transform = 'translateY(0)';
            modalContent.style.opacity = '1';
        }
    }

    // ==============================
    // Pinch-утилиты
    // ==============================
    function getPinchDistance(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        return Math.sqrt(dx*dx + dy*dy);
    }

    function getPinchCenter(p1, p2) {
        return {
            x: (p1.x + p2.x) / 2,
            y: (p1.y + p2.y) / 2
        };
    }

    function applyZoomAroundPoint(newScale, pinchX, pinchY, pinchCenterStart) {
        let deltaScale = newScale - scale;
        const rect = imageStage.getBoundingClientRect();

        let relX = (pinchX - rect.left) / rect.width;
        let relY = (pinchY - rect.top) / rect.height;

        offsetX -= relX * deltaScale * rect.width;
        offsetY -= relY * deltaScale * rect.height;

        scale = Math.max(1, Math.min(newScale, 3));
        updateBackground();
        syncZoomSlider();
    }

    // ==============================
    // Двойной клик/тап
    // ==============================
    function handleDoublePress(e) {
        const rect = imageStage.getBoundingClientRect();
        const cursorX = e.clientX - rect.left;
        const cursorY = e.clientY - rect.top;

        let newScale = (scale === 1) ? 2 : 1;
        applyZoomCenterPreserving(newScale, cursorX, cursorY);
    }

    // ==============================
    // Клавиши
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
