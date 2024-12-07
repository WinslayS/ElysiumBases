document.addEventListener("DOMContentLoaded", () => {
    fetch('data/layouts.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const gallery = document.getElementById('gallery');
            gallery.innerHTML = ''; // Очистка перед добавлением
            data.forEach(item => {
                const html = `
                    <div class="item" data-categories="${item.category}">
                        <div class="photo-info">
                            <span class="photo-count">#${item.id}</span>
                            ${item.status ? `<span class="photo-status ${item.status === 'updated' ? 'updated' : 'new'}">${item.status === 'updated' ? 'Обновлено' : 'Новая'}</span>` : ''}
                        </div>
                        <img src="${item.image}" alt="Расстановка ${item.id}" class="zoomable" data-id="${item.id}">
                        <div class="name-category">
                            <p class="name">${item.name}</p>
                            <span class="category">#${item.category}</span>
                        </div>
                        <a href="${item.link}" target="_blank" class="button">Скопировать базу</a>
                    </div>
                `;
                gallery.innerHTML += html;
            });

            // Отправка события после рендеринга
            document.dispatchEvent(new Event('layoutsRendered'));
        })
        .catch(error => console.error('Ошибка загрузки JSON:', error));
});
