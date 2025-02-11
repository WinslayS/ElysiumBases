/* js/header.js */
document.addEventListener('DOMContentLoaded', function () {
  const header = document.querySelector('.header-top');
  const dropdownMenu = document.querySelector('.dropdown-menu');
  // Выбираем только ссылки внутри элементов с классом "dropdown"
  const dropdownLinks = document.querySelectorAll('.nav-menu .dropdown > a');
  // Для управления подсветкой открытого раздела – получим все элементы li с классом dropdown
  const dropdownItems = document.querySelectorAll('.nav-menu li.dropdown');

  // Объект с подменю для каждого раздела (ключ – значение атрибута href)
  const submenus = {
    "bases.html": [
      { text: "Загрузить", href: "upload.html" },
      { text: "Расстановки", href: "layouts.html" },
    ],
    "mix.html": [
      { text: "Создать", href: "create.html" },
      { text: "Смотреть", href: "view.html" }
    ],
    "advice.html": [
      { text: "Герои", href: "heroes.html" },
      { text: "Подкрепления", href: "reinforcements.html" },
      { text: "Ошибки", href: "mistakes.html" }
    ]
  };

  let currentDropdownKey = null;
  let hideTimeout;
  let changeTimeout;

  // Обновление содержимого панели по ключу (значение href)
  function updateDropdownContent(key) {
    if (submenus[key]) {
      let html = '<ul>';
      submenus[key].forEach(item => {
        html += `<li><a href="${item.href}">${item.text}</a></li>`;
      });
      html += '</ul>';
      dropdownMenu.innerHTML = html;
    } else {
      dropdownMenu.innerHTML = '';
    }
    currentDropdownKey = key;
  }

  // Функция показа панели с анимацией замены
  function showDropdown(key) {
    // Если уже открыт нужный раздел и панель видна – ничего не делаем
    if (currentDropdownKey === key && dropdownMenu.classList.contains('active')) {
      return;
    }
    // Сначала убираем подсветку со всех элементов
    dropdownItems.forEach(item => item.classList.remove('active'));
    // Подсвечиваем элемент, на котором навели (его href совпадает с key)
    dropdownLinks.forEach(link => {
      if (link.getAttribute('href') === key) {
        link.parentElement.classList.add('active');
      }
    });
    
    // Если панель уже активна – запускаем анимацию исчезновения, затем обновляем контент и снова показываем её
    if (dropdownMenu.classList.contains('active')) {
      dropdownMenu.classList.remove('active');
      clearTimeout(changeTimeout);
      changeTimeout = setTimeout(function () {
        updateDropdownContent(key);
        dropdownMenu.classList.add('active');
      }, 500); // длительность анимации 0.5 с
    } else {
      updateDropdownContent(key);
      dropdownMenu.classList.add('active');
    }
  }

  // Функция скрытия панели и снятия подсветки
  function hideDropdown() {
    dropdownMenu.classList.remove('active');
    dropdownItems.forEach(item => item.classList.remove('active'));
    currentDropdownKey = null;
  }

  // При наведении на разделы с подменю – показываем панель с соответствующим содержимым
  dropdownLinks.forEach(link => {
    link.addEventListener('mouseenter', function () {
      clearTimeout(hideTimeout);
      const key = link.getAttribute('href');
      showDropdown(key);
    });
  });

  // Если курсор уходит из области шапки или панели – скрываем панель с задержкой
  header.addEventListener('mouseleave', function () {
    hideTimeout = setTimeout(hideDropdown, 500);
  });
  header.addEventListener('mouseenter', function () {
    clearTimeout(hideTimeout);
  });
  dropdownMenu.addEventListener('mouseenter', function () {
    clearTimeout(hideTimeout);
  });
  dropdownMenu.addEventListener('mouseleave', function () {
    hideTimeout = setTimeout(hideDropdown, 500);
  });
});
