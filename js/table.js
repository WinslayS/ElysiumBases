document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM загружен, начинается загрузка таблицы...');
    const table = document.querySelector('#table-output table');

    if (table) {
        table.addEventListener('click', (event) => {
            const rows = table.querySelectorAll('tr');
            rows.forEach(row => row.classList.remove('selected')); // Убираем выделение со всех строк

            const clickedRow = event.target.closest('tr');
            if (clickedRow) {
                clickedRow.classList.add('selected'); // Выделяем кликнутую строку
            }
        });
    }
});

    fetch('data/cwl12-24.xlsx')
        .then(response => {
            if (!response.ok) throw new Error(`Ошибка загрузки файла: ${response.statusText}`);
            console.log('Файл CWL.xlsx успешно загружен.');
            return response.arrayBuffer();
        })
        .then(data => {
            const workbook = XLSX.read(new Uint8Array(data), { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            console.log('Таблица успешно прочитана, начинается преобразование...');
            const html = XLSX.utils.sheet_to_html(worksheet);
            document.getElementById('table-output').innerHTML = html;
            console.log('Таблица отображена на странице.');
        })
        .catch(error => {
            console.error('Ошибка:', error);
            document.getElementById('table-output').innerText = 'Не удалось загрузить таблицу.';
        });

// Функция для отображения Excel контейнера
function showExcelTable() {
    document.getElementById('excel-container').style.display = 'block';
}
document.getElementById('searchBox').addEventListener('input', function () {
    const searchText = this.value.toLowerCase();
    const rows = document.querySelectorAll('#table-output table tr');

    rows.forEach((row, index) => {
        if (index === 0) return; // Пропускаем заголовок
        const cells = row.querySelectorAll('td');
        const rowText = Array.from(cells).map(cell => cell.textContent.toLowerCase()).join(' ');
        row.style.display = rowText.includes(searchText) ? '' : 'none';
    });
});
