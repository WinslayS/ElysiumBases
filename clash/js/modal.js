        const modal = document.getElementById('modal');
        const modalImage = document.getElementById('modalImage');
        const thumbnailsContainer = document.getElementById('thumbnailsContainer');
        const zoomableImages = document.querySelectorAll('.zoomable');
        const thumbnailData = {
            "1": ["images/1a.webp", "images/1b.webp", "images/1c.webp"],
            "2": ["images/2a.webp", "images/2b.webp", "images/2c.webp"],
            "3": ["images/3a.webp", "images/3b.webp", "images/3c.webp"],
            "4": ["images/4a.webp", "images/4b.webp", "images/4c.webp"],
            "5": ["images/5a.webp", "images/5b.webp", "images/5c.webp"],
            "6": ["images/6a.webp", "images/6b.webp", "images/6c.webp"]
        };
        zoomableImages.forEach(img => {
            img.addEventListener('click', () => {
                const id = img.dataset.id; // Получаем ID изображения
                modal.style.display = 'flex';
                modalImage.src = img.src;
   	     document.body.classList.add('modal-open'); 	     // Добавляем класс к body для размытия заднего фона
                thumbnailsContainer.innerHTML = '';               // Очищаем контейнер миниатюр
                if (thumbnailData[id]) {
                    thumbnailData[id].forEach(src => {
                        const thumb = document.createElement('img');
                        thumb.src = src;
                        thumb.alt = "Миниатюра";
                        thumb.addEventListener('click', () => {
                            modalImage.src = src; // Переключаем изображение
                        });
                        thumbnailsContainer.appendChild(thumb);
                    });
                }
            });
        });
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target === modalImage) {
                modal.style.display = 'none';
                modalImage.src = '';
                thumbnailsContainer.innerHTML = ''; // Очищаем миниатюры
 	       document.body.classList.remove('modal-open'); 	       // Удаляем класс у body, чтобы убрать размытие
            }
        });

modal.classList.add('show');
modal.addEventListener('transitionend', () => {
    if (!modal.classList.contains('show')) {
        modal.style.display = 'none';
    }
});
modal.classList.remove('show');

if (!thumbnailData[id]) {
    console.warn(`Нет данных для миниатюр с ID ${id}`);
    return;
}