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
                <div class="item" data-categories="${item.category}" data-status="${item.status || ''}">
                    <div class="photo-info">
                        ${item.status ? `<span class="photo-status ${item.status === 'updated' ? 'updated' : 'new'}">${item.status === 'updated' ? 'Обновлено' : 'Новая'}</span>` : ''}
                        ${item.verification === 'verified' ? '<span class="photo-verified">Проверено</span>' : ''}
                    </div>
                    <img 
                        src="${item.thumbnail}" 
                        alt="Расстановка ${item.id}" 
                        class="zoomable" 
                        data-id="${item.id}" 
                        data-full-image="${item.fullImage}">
                    <div class="name-category">
                        <p class="name">${item.name}</p>
                        <span class="category">#${item.category}</span>
                    </div>
                    <div class="action-buttons">
                        <a href="${item.link}" target="_blank" class="button">Скопировать базу</a>
                        <button class="share-button" title="Поделиться">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-share-fill" viewBox="0 0 16 16">
                                <path d="M11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.5 2.5 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5"/>
                            </svg>
                        </button>
                    </div>
                </div>
                `;
                
            
                gallery.innerHTML += html;
            });

            // Отправка события после рендеринга
            document.dispatchEvent(new Event('layoutsRendered'));
        })
        .catch(error => console.error('Ошибка загрузки JSON:', error));
});

document.addEventListener("layoutsRendered", () => {
    const gallery = document.querySelector(".gallery");
    const items = gallery.querySelectorAll(".item");
    const minItemsPerRow = 4; // Минимальное количество элементов в ряду
    const currentRowCount = Math.ceil(items.length / minItemsPerRow); // Считаем строки
    const totalItemsNeeded = currentRowCount * minItemsPerRow; // Общее количество элементов для полного заполнения строк

    // Если не хватает элементов для полной строки, добавляем заполнители
    if (items.length < totalItemsNeeded) {
        for (let i = items.length; i < totalItemsNeeded; i++) {
            const placeholder = document.createElement("div");
            placeholder.className = "item placeholder";
            placeholder.style.visibility = "hidden"; // Скрываем заполнители
            gallery.appendChild(placeholder);
        }
    }
});

document.addEventListener("layoutsRendered", () => {
    // Добавляем обработчик для всех кнопок "Поделиться"
    const shareButtons = document.querySelectorAll('.share-button');
    
    shareButtons.forEach((button) => {
        button.addEventListener('click', async (event) => {
            const item = event.target.closest('.item');
            const shareLink = item.querySelector('a.button').href; // Получаем ссылку на базу
            const shareTitle = item.querySelector('.name').textContent; // Название базы
            
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: `Поделитесь базой "${shareTitle}"!`,
                        text: `Посмотрите эту базу для Clash of Clans: "${shareTitle}"`,
                        url: shareLink,
                    });
                    console.log('Успешно поделились');
                } catch (error) {
                    console.error('Ошибка при попытке поделиться:', error);
                }
            } else {
                alert('Web Share API не поддерживается на вашем устройстве.');
            }
        });
    });
});
