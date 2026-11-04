document.addEventListener('DOMContentLoaded', function () {
    // 1. Внедряем HTML модального окна и баннера
    if (!document.getElementById('cookie-modal')) {
        const modalHTML = `
            <!-- Модальное окно настроек -->
            <div class="cookie-modal" id="cookie-modal">
                <div class="cookie-modal-content">
                    <div class="cookie-header">
                        <h2>COOKIE SETTINGS</h2>
                        <button class="cookie-close" id="close-cookie">&times;</button>
                    </div>
                    
                    <div class="cookie-body">
                        <p>We use cookies to offer you a better browsing experience and analyze site traffic. Click on the different category headings to find out more. You can also change your cookie preferences. Note that blocking some types of cookies may impact your experience on our websites and the services we are able to offer.</p>
                        <a href="privacy.html" class="cookie-link">Privacy Statement</a>

                        <div class="cookie-divider"></div>
                        <div class="cookie-option">
                            <div class="cookie-label">
                                <span class="cookie-arrow">›</span>
                                <strong>Essential Cookies</strong>
                            </div>
                            <label class="toggle">
                                <input type="checkbox" checked disabled>
                                <span class="slider"></span>
                            </label>
                        </div>

                        <div class="cookie-divider"></div>
                        <div class="cookie-option">
                            <div class="cookie-label">
                                <span class="cookie-arrow">›</span>
                                <strong>Preference Cookies</strong>
                            </div>
                            <label class="toggle">
                                <input type="checkbox" id="pref-cookies" checked>
                                <span class="slider"></span>
                            </label>
                        </div>

                        <div class="cookie-divider"></div>
                        <div class="cookie-option">
                            <div class="cookie-label">
                                <span class="cookie-arrow">›</span>
                                <strong>Analytical Cookies</strong>
                            </div>
                            <label class="toggle">
                                <input type="checkbox" id="analytics-cookies" checked>
                                <span class="slider"></span>
                            </label>
                        </div>
                    </div>

                    <div class="cookie-footer">
                        <button class="cookie-btn" id="save-settings">Save settings</button>
                        <button class="cookie-btn" id="accept-all">Accept all</button>
                    </div>
                </div>
            </div>

            <!-- Баннер снизу (появляется, если выбор еще не сделан) -->
            <div class="cookie-banner" id="cookie-banner" style="display: none;">
                <p>We use cookies to improve your experience. By clicking "Accept", you agree to our use of cookies.</p>
                <div class="cookie-banner-btns">
                    <button id="banner-settings" class="cookie-banner-btn">Settings</button>
                    <button id="banner-accept" class="cookie-banner-btn accept">Accept</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // 2. Получаем элементы
    const modal = document.getElementById('cookie-modal');
    const banner = document.getElementById('cookie-banner');
    const openBtn = document.getElementById('open-cookie'); // Кнопка в футере
    const closeBtn = document.getElementById('close-cookie');
    const saveBtn = document.getElementById('save-settings');
    const acceptBtn = document.getElementById('accept-all');
    
    const prefToggle = document.getElementById('pref-cookies');
    const analyticsToggle = document.getElementById('analytics-cookies');

    // Кнопки на баннере
    const bannerAccept = document.getElementById('banner-accept');
    const bannerSettings = document.getElementById('banner-settings');

    // 3. Функции управления куки
    function setCookie(name, value, days) {
        const d = new Date();
        d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = "expires=" + d.toUTCString();
        document.cookie = name + "=" + value + ";" + expires + ";path=/;SameSite=Lax";
    }

    function getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    // Применяем настройки (в будущем здесь можно загружать скрипты аналитики)
    function applySettings(pref, analytics) {
        if (analytics === 'true') {
            // Сюда можно вставить код подключения Google Analytics или других скриптов
            console.log('✅ Analytical cookies enabled');
        } else {
            console.log('❌ Analytical cookies disabled');
        }
        
        if (pref === 'true') {
            console.log('✅ Preference cookies enabled');
        }
    }

    // 4. Проверяем, делал ли пользователь выбор ранее
    const consent = getCookie('cookie_consent');
    if (!consent) {
        // Если выбора нет, показываем баннер через 1 секунду
        setTimeout(() => {
            banner.style.display = 'flex';
        }, 1000);
    } else {
        // Если выбор есть, применяем сохраненные настройки
        const pref = getCookie('cookie_pref') || 'true';
        const analytics = getCookie('cookie_analytics') || 'true';
        
        // Обновляем состояние тумблеров в модалке
        if (prefToggle) prefToggle.checked = pref === 'true';
        if (analyticsToggle) analyticsToggle.checked = analytics === 'true';
        
        applySettings(pref, analytics);
    }

    // 5. Обработчики событий

    // Открыть модалку
    function openModal() {
        modal.classList.add('active');
        banner.style.display = 'none'; // Скрываем баннер при открытии настроек
    }

    // Закрыть модалку
    function closeModal() {
        modal.classList.remove('active');
    }

    // Сохранить настройки
    function saveSettings(acceptAll = false) {
        let pref = acceptAll ? 'true' : (prefToggle ? prefToggle.checked.toString() : 'true');
        let analytics = acceptAll ? 'true' : (analyticsToggle ? analyticsToggle.checked.toString() : 'true');

        // Сохраняем в куки на 365 дней
        setCookie('cookie_consent', 'true', 365);
        setCookie('cookie_pref', pref, 365);
        setCookie('cookie_analytics', analytics, 365);

        // Применяем
        applySettings(pref, analytics);

        // Закрываем
        closeModal();
        banner.style.display = 'none';
    }

    // Слушатели
    if (openBtn) openBtn.addEventListener('click', (e) => { e.preventDefault(); openModal(); });
    if (bannerSettings) bannerSettings.addEventListener('click', openModal);
    
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (saveBtn) saveBtn.addEventListener('click', () => saveSettings(false));
    if (acceptBtn) acceptBtn.addEventListener('click', () => saveSettings(true));
    if (bannerAccept) bannerAccept.addEventListener('click', () => saveSettings(true));

    // Закрытие по клику на фон
    modal.addEventListener('click', function(e) {
        if (e.target === modal) closeModal();
    });
});