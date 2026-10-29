document.addEventListener('DOMContentLoaded', function () {

    if (!document.getElementById('cookie-modal')) {
        const modalHTML = `
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
                                <input type="checkbox" checked>
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
                                <input type="checkbox" checked>
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
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }


    const modal = document.getElementById('cookie-modal');
    const openBtn = document.getElementById('open-cookie');
    const closeBtn = document.getElementById('close-cookie');
    const saveBtn = document.getElementById('save-settings');
    const acceptBtn = document.getElementById('accept-all');

    if (!openBtn) return;

    openBtn.addEventListener('click', function(e) {
        e.preventDefault();
        modal.classList.add('active');
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            modal.classList.remove('active');
        });
    }

    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            modal.classList.remove('active');
        });
    }

    if (acceptBtn) {
        acceptBtn.addEventListener('click', function() {
            modal.classList.remove('active');
        });
    }
});