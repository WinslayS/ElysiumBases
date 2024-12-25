// Находим основные элементы
const filterPanelToggle = document.getElementById("filterPanelToggle");
const filterSection = document.querySelector(".filter-section");
const mainContainer = document.querySelector(".main-container");

// Создаём кнопку "Фильтры" (будет на маленьких экранах внизу)
const showFiltersButton = document.createElement("button");
showFiltersButton.id = "showFiltersButton";
showFiltersButton.textContent = "Фильтры";
showFiltersButton.classList.add("filter-toggle-button", "show-filters-button");
showFiltersButton.style.display = "none"; // По умолчанию скрыта (для больших экранов)
document.body.appendChild(showFiltersButton);

// ----- Логика скрытия/показа панели (объединённая) -----

// Открыть панель (убрать hidden, добавить show)
function openFilterPanel() {
  filterSection.classList.remove("hidden");
  filterSection.classList.add("show");
  mainContainer.classList.remove("fullscreen"); // Если нужно убирать fullscreen
  // Кнопки
  filterPanelToggle.style.display = "block";
  showFiltersButton.style.display = "none";
}

// Закрыть панель (убрать show, добавить hidden)
function closeFilterPanel() {
  filterSection.classList.remove("show");
  filterSection.classList.add("hidden");
  mainContainer.classList.add("fullscreen");
  // Кнопки
  filterPanelToggle.style.display = "none";
  showFiltersButton.style.display = "block";
}

// Клик по кнопке (большая) "Скрыть/Показать"
filterPanelToggle.addEventListener("click", () => {
  // Если панель сейчас открыта (.show), то закрываем
  if (filterSection.classList.contains("show")) {
    closeFilterPanel();
  } else {
    openFilterPanel();
  }
});

// Клик по кнопке "Фильтры" (на маленьких экранах)
showFiltersButton.addEventListener("click", () => {
  openFilterPanel();
});

// ----- Логика фильтрации (ваша изначальная) -----
const filterCategories = document.querySelectorAll('.filter-category');
const filterStatuses = document.querySelectorAll('.filter-status');

// Функция активации/деактивации
function toggleActiveFilter(buttons, clickedButton) {
  if (clickedButton.classList.contains('active')) {
    clickedButton.classList.remove('active');
  } else {
    buttons.forEach(button => button.classList.remove('active'));
    clickedButton.classList.add('active');
  }
}

function filterGallery() {
  const galleryItems = document.querySelectorAll('.gallery .item');
  const activeCategory = document.querySelector('.filter-category.active')?.dataset.category;
  const activeStatus = document.querySelector('.filter-status.active')?.dataset.status;

  galleryItems.forEach(item => {
    const itemCategory = item.getAttribute('data-categories');
    const itemStatus = item.getAttribute('data-status');

    const categoryMap = {
      "war": "война",
      "resources": "ресурсы",
      "decor": "декор"
    };
    const mappedCategory = categoryMap[activeCategory] || null;

    const categoryMatch = !activeCategory || itemCategory === mappedCategory;
    const statusMatch = !activeStatus || itemStatus === activeStatus;

    if (categoryMatch && statusMatch) {
      item.style.display = 'block';
    } else {
      item.style.display = 'none';
    }
  });
}

// Навешиваем события клика на кнопки
filterCategories.forEach(button => {
  button.addEventListener('click', () => {
    toggleActiveFilter(filterCategories, button);
    filterGallery();
  });
});

filterStatuses.forEach(button => {
  button.addEventListener('click', () => {
    toggleActiveFilter(filterStatuses, button);
    filterGallery();
  });
});

// ----- Логика адаптива (updateFiltersState) -----

function updateFiltersState() {
  const screenWidth = window.innerWidth;

  if (filterSection && mainContainer && showFiltersButton) {
    // Проверяем, скрыта ли панель сейчас
    const filtersHidden = filterSection.classList.contains("hidden");

    // Ваши условия: <= 379, 380-699, 900-1099...
    // Предположим, что при ширине до 699 хотим панель снизу (всплывающую)
    if (screenWidth <= 379 || (screenWidth >= 380 && screenWidth <= 699) || (screenWidth >= 900 && screenWidth <= 1199)) {
      // На этих разрешениях по умолчанию хотим панель скрытой (чтобы всплывала)
      if (!filtersHidden) {
        // Если она не скрыта — скроем
        closeFilterPanel();
      }
    } else {
      // Иначе (например, > 699, но не попадаем в 900..1099) – показываем панель
      if (filtersHidden) {
        openFilterPanel();
      }
    }
  }
}

// При загрузке страницы сразу проверяем ширину
document.addEventListener("DOMContentLoaded", () => {
  updateFiltersState();
});

// При ресайзе тоже проверяем
window.addEventListener("resize", () => {
  updateFiltersState();
});
