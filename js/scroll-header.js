const headerNav = document.querySelector('.header-nav');
const headerTop = document.querySelector('.header-top');

let lastScrollPosition = 0; // Последняя позиция прокрутки
let isNavVisible = false; // Состояние видимости панели
const headerTopHeight = headerTop.offsetHeight; // Высота верхней шапки

// Создаём плейсхолдер для предотвращения сдвигов
const headerPlaceholder = document.createElement('div');
headerPlaceholder.style.height = `${headerTopHeight}px`;
headerPlaceholder.style.display = 'none'; // Плейсхолдер скрыт по умолчанию
headerTop.insertAdjacentElement('afterend', headerPlaceholder);

window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;

    if (currentScroll > headerTopHeight) {
        if (currentScroll < lastScrollPosition && !isNavVisible) {
            // Прокрутка вверх: показываем панель
            headerNav.style.position = "fixed";
            headerNav.style.top = "0";
            headerNav.style.transform = "translateY(0)";
            headerNav.style.transition = "transform 0.3s ease";
            headerPlaceholder.style.display = 'block'; // Показываем плейсхолдер
            isNavVisible = true;
        } else if (currentScroll > lastScrollPosition && isNavVisible) {
            // Прокрутка вниз: скрываем панель
            headerNav.style.transform = "translateY(-100%)";
            headerPlaceholder.style.display = 'block'; // Плейсхолдер остаётся для предотвращения сдвига
            isNavVisible = false;
        }
    } else {
        // Когда верх страницы виден
        headerNav.style.position = "relative";
        headerNav.style.top = "auto";
        headerNav.style.transform = "translateY(0)";
        headerPlaceholder.style.display = 'none'; // Скрываем плейсхолдер
        isNavVisible = false;
    }

    // Обновляем последнюю позицию прокрутки
    lastScrollPosition = currentScroll;
});
document.getElementById('tgHandle').addEventListener('click', function() {
    const textToCopy = this.innerText;
    navigator.clipboard.writeText(textToCopy).then(() => {
    }).catch(err => {
        console.error('Ошибка копирования: ', err);
    });
});