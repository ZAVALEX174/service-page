document.addEventListener('DOMContentLoaded', () => {
    const customSelect = document.querySelector('.custom-select');
    const selectedOption = customSelect.querySelector('.selected-option');
    const options = customSelect.querySelectorAll('.options li');
    const arrowOrange = document.querySelector('.arrow');
    const closeSelectBtn = document.querySelector('.closes-select');
    const optionsList = customSelect.querySelector('.options');

    const openOptions = () => {
        arrowOrange.classList.add('arrow-selected');
        optionsList.style.display = 'block';
        closeSelectBtn.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    };

    // Функция для закрытия списка
    const closeOptions = () => {
        optionsList.style.display = 'none';
        arrowOrange.classList.remove('arrow-selected');
        closeSelectBtn.style.display = 'none';
        document.body.style.overflow = '';
    };

    // Функция для выбора варианта
    const selectOption = (option) => {
        const value = option.getAttribute('data-value');
        const text = option.textContent;

        if (value === 'Russian') {
            selectedOption.querySelector('span').textContent = 'Русский';
        } else {
            selectedOption.querySelector('span').textContent = text;
        }

        closeOptions();
    };

    // Открытие списка
    // selectedOption.addEventListener('click', openOptions);

    // Выбор варианта
    options.forEach(option => {
        option.addEventListener('click', () => selectOption(option));
    });

    // Закрытие по кнопке
    closeSelectBtn.addEventListener('click', closeOptions);

    // Закрытие списка при клике вне элемента
    document.addEventListener('click', (event) => {
        if (!customSelect.contains(event.target)) {
            closeOptions();
        }
    });
});