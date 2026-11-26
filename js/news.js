document.addEventListener('DOMContentLoaded', () => {
    const viewMoreBtn = document.getElementById('view-more-btn');
    const extraNews = document.getElementById('extra-news');

    if (viewMoreBtn && extraNews) {
        viewMoreBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Отменяем переход по ссылке "#"

            // Проверяем, скрыт ли блок сейчас
            const isHidden = !extraNews.classList.contains('show');

            if (isHidden) {
                // Показываем
                extraNews.classList.add('show');
                viewMoreBtn.textContent = 'View less'; // Меняем текст кнопки
            } else {
                // Скрываем
                extraNews.classList.remove('show');
                viewMoreBtn.textContent = 'View more';
            }
        });
    }
});