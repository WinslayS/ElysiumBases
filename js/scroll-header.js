    let lastScrollY = window.scrollY; // Текущее положение скролла
    const header = document.querySelector('.header');

    window.addEventListener('scroll', () => {
        if (window.scrollY > lastScrollY) {
            header.classList.add('hidden'); // Прячем шапку при прокрутке вниз
        } else {
            header.classList.remove('hidden'); // Показываем шапку при прокрутке вверх
        }
        lastScrollY = window.scrollY; // Обновляем текущее положение
    });