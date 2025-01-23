// Наш список таблиц
const sheetsList = [
    {
      name: "Декабрь 24г",
      url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSoyc-sQMkzWIH68hidY4ka8MdbcZ_o7TJ48Y2d20t2xItnJUckZFnSdgtuaA8jsSA2hxRc2Ub5Im60/pub?output=tsv"
    },
    {
      name: "Январь 25г",
      url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTtMUpXZgK-YI2q95yAXTtPTLNF0b99qZ4JkzzKm1Azq_Nw8pjXgFYJmLoryKkuRjWzuZddLPTbJkYg/pub?output=tsv"
    },
    {
      name: "Февраль 25г",
      url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSO0Q4Cz6RLM3_9SPt8zY9JNm_nbnI5WQDn36OlFKHQZwkrGalQVsIFBTB3aJdxr4cenDe5Laf1qsoL/pub?output=tsv"
    },
  ];
  
  // Если вы хотите, чтобы самый новый был вверху, оставьте .reverse():
  sheetsList.reverse();
  
  // Отключаем всплывающие ошибки DataTables:
  $.fn.dataTable.ext.errMode = 'none';
  
  // Ссылка на текущий экземпляр DataTable (для destroy)
  let dataTable = null;
  
  /**
   * Простой парсер TSV (tab-separated values).
   * Если CSV через ";", меняйте '\t' => ';'.
   */
  function parseTSV(tsv) {
    const lines = tsv.trim().split('\n');
    return lines.map(line => line.split('\t'));
  }
  
  /**
   * Загружаем таблицу с сбросом кэша, строим Thead/Tbody, инициализируем DataTables.
   */
  async function loadTable(url) {
    try {
      // Добавляем случайный параметр к ссылке, чтобы точно избежать кэширования
      const noCacheUrl = url + '&t=' + Date.now();
  
      const response = await fetch(noCacheUrl, { cache: 'no-store' });
      const textData = await response.text();
  
      const parsed = parseTSV(textData);
      if (!parsed || parsed.length === 0) {
        console.warn("Данные пустые или не корректны");
        return;
      }
  
      const headers = parsed[0];
      const rows = parsed.slice(1);
  
      const thead = document.querySelector('#myDataTable thead');
      const tbody = document.querySelector('#myDataTable tbody');
  
      // Очищаем старые данные
      thead.innerHTML = '';
      tbody.innerHTML = '';
  
      // Создаём заголовок
      const headerRow = document.createElement('tr');
      headers.forEach(h => {
        const th = document.createElement('th');
        th.textContent = h;
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
  
      // Создаём строки
      rows.forEach(r => {
        const tr = document.createElement('tr');
        r.forEach(cell => {
          const td = document.createElement('td');
          td.textContent = cell;
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
  
      // Уничтожаем предыдущую DataTable, если есть
      if (dataTable) {
        dataTable.destroy();
        dataTable = null;
      }
  
      // Показываем .datatable-wrapper (была скрыта)
      document.querySelector('.datatable-wrapper').style.display = 'block';
  
      // Инициализируем DataTables
      dataTable = $('#myDataTable').DataTable({
        paging: false,
        info: false,
        lengthChange: false,
        ordering: false,
        // Поиск включён:
        searching: true,
        // Но ограничиваем его только на первый столбец
        columnDefs: [
          { searchable: true,  targets: 0 }, // только 0-й (первый) столбец
          { searchable: false, targets: "_all" }
        ],
        // Расположение элементов: 'f' - поиск, 't' - сама таблица, 'r' - обработка
        dom: 'ftr',
        language: {
          url: 'https://cdn.datatables.net/plug-ins/1.13.5/i18n/ru.json'
        }
      });
  
    } catch (err) {
      console.error('Ошибка при загрузке таблицы:', err);
    }
  }
  
  /**
   * При загрузке страницы делаем кнопки-плашки в столбик.
   * Не загружаем ничего автоматически — пользователь сам выбирает.
   */
  document.addEventListener('DOMContentLoaded', () => {
    const tabsContainer = document.getElementById('tabsContainer');
  
    sheetsList.forEach(item => {
      const btn = document.createElement('button');
      btn.textContent = item.name;
  
      // При нажатии:
      btn.addEventListener('click', () => {
        // Снимаем класс active-tab со всех
        tabsContainer.querySelectorAll('button').forEach(b => {
          b.classList.remove('active-tab');
        });
        // Текущей кнопке присваиваем
        btn.classList.add('active-tab');
  
        // Грузим таблицу
        loadTable(item.url);
      });
  
      tabsContainer.appendChild(btn);
    });
  
    // Если хотите сразу загружать первую:
    // if (sheetsList.length > 0) {
    //   tabsContainer.querySelector('button').click();
    // }
  });

