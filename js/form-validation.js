document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.join-form');
  if (!form) return;

  // ---------- Элементы формы ----------
  const inputs = form.querySelectorAll(
    'input[type="text"], input[type="email"], input[type="tel"], input[type="date"]'
  );
  const checkboxes = form.querySelectorAll('input[type="checkbox"]');
  const fileInputs = form.querySelectorAll('input[type="file"]');
  const submitBtn = form.querySelector('.join-btn');

  // ---------- Элементы модального окна ----------
  const modal = document.getElementById('successModal');
  const closeBtn = document.getElementById('closeSuccessBtn');

  // ---------- Константы ----------
  const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const SERVER_URL = 'http://localhost:3000/submit-form';

  // ---------- Хелперы ----------
  function getFieldWrapper(input) {
    return (
      input.closest('.field') ||
      input.closest('.checkbox') ||
      input.closest('.photo-upload')
    );
  }

  function showError(input, message) {
    const field = getFieldWrapper(input);
    if (!field) return;

    field.classList.add('error');

    let errorEl = field.querySelector('.field-error');
    if (!errorEl) {
      errorEl = document.createElement('span');
      errorEl.className = 'field-error';
      field.appendChild(errorEl);
    }
    errorEl.textContent = message;
  }

  function clearError(input) {
    const field = getFieldWrapper(input);
    if (!field) return;

    field.classList.remove('error');
    const errorEl = field.querySelector('.field-error');
    if (errorEl) errorEl.textContent = '';
  }

  // ---------- Валидация текстовых полей ----------
  function validateTextInput(input) {
    const value = input.value.trim();

    if (!value) {
      showError(input, 'This field is required');
      return false;
    }

    // ===== LOCATION =====
    if (input.name === 'location') {
      const commaCount = (value.match(/,/g) || []).length;
      if (commaCount !== 1) {
        showError(input, 'Exactly one comma required. Example: Minsk, Belarus');
        return false;
      }

      if (/\s,/.test(value)) {
        showError(input, 'Remove the space before the comma');
        return false;
      }

      const parts = value.split(',').map(p => p.trim());
      if (parts.length !== 2 || !parts[0] || !parts[1]) {
        showError(input, 'Format: City, Country. Example: Minsk, Belarus');
        return false;
      }

      const wordPattern = /^[A-Za-zА-Яа-яЁё]+(?:[\s\-][A-Za-zА-Яа-яЁё]+)*$/;
      if (!wordPattern.test(parts[0])) {
        showError(input, 'City: letters, spaces and hyphens only');
        return false;
      }
      if (!wordPattern.test(parts[1])) {
        showError(input, 'Country: letters, spaces and hyphens only');
        return false;
      }

      if (/\s{2,}/.test(value)) {
        showError(input, 'Remove double spaces');
        return false;
      }
    }

    // ===== EMAIL =====
    if (input.name === 'email') {
      if (!/^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/.test(value)) {
        showError(input, 'Invalid e-mail. Example: name@example.com');
        return false;
      }

      const [local, domain] = value.split('@');

      if (local.startsWith('.') || local.endsWith('.')) {
        showError(input, 'Dot cannot be at the start/end of the name');
        return false;
      }

      if (/\.\./.test(local)) {
        showError(input, 'Two dots in a row in the name');
        return false;
      }

      if (/^[.\-]|[.\-]$/.test(domain)) {
        showError(input, 'Domain cannot start/end with a dot or hyphen');
        return false;
      }

      if (/\.\./.test(domain)) {
        showError(input, 'Two dots in a row in the domain');
        return false;
      }

      const domainParts = domain.split('.');
      for (const part of domainParts) {
        if (!part) {
          showError(input, 'Empty domain segment');
          return false;
        }
        if (part.startsWith('-') || part.endsWith('-')) {
          showError(input, 'Hyphen cannot be at the start/end of a domain segment');
          return false;
        }
      }

      const tld = domainParts[domainParts.length - 1];
      if (!/^[A-Za-z]{2,}$/.test(tld)) {
        showError(input, 'Invalid domain zone (e.g. .com, .by)');
        return false;
      }
    }

    // ===== PHONE (Belarus) =====
    if (input.name === 'phone') {
      const digits = value.replace(/[\s\-\(\)]/g, '');
      let normalized = digits;

      if (normalized.startsWith('+375')) {
        normalized = normalized.slice(4);
      } else if (normalized.startsWith('375')) {
        normalized = normalized.slice(3);
      } else if (normalized.startsWith('80')) {
        normalized = normalized.slice(2);
      } else {
        showError(input, 'Number must start with +375, 375 or 80');
        return false;
      }

      if (!/^\d{9}$/.test(normalized)) {
        showError(input, 'After the country code there must be 9 digits');
        return false;
      }

      const operatorCode = normalized.slice(0, 2);
      if (!['17', '25', '29', '33', '44'].includes(operatorCode)) {
        showError(input, 'Invalid operator code (17, 25, 29, 33, 44)');
        return false;
      }
    }

    // ===== Браузерная валидация =====
    if (!input.checkValidity()) {
      let msg = 'Invalid value';
      if (input.validity.patternMismatch) msg = input.title || 'Invalid format';
      else if (input.validity.typeMismatch) msg = 'Invalid format';
      else if (input.validity.tooShort) msg = `Minimum ${input.minLength} characters`;
      else if (input.validity.tooLong) msg = `Maximum ${input.maxLength} characters`;
      else if (input.validity.rangeOverflow) msg = 'Date is too late';
      else if (input.validity.rangeUnderflow) msg = 'Date is too early';
      showError(input, msg);
      return false;
    }

    clearError(input);
    return true;
  }

  // ---------- Валидация файлов ----------
  function validateFile(input) {
    const file = input.files[0];
    if (!file) {
      showError(input, 'Please upload a photo');
      return false;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      showError(input, 'Allowed: JPG, PNG, WEBP');
      return false;
    }
    if (file.size > MAX_SIZE) {
      showError(input, 'File is larger than 10 MB');
      return false;
    }
    clearError(input);
    return true;
  }

  // ---------- Валидация чекбоксов ----------
  function validateCheckbox(input) {
    if (!input.checked) {
      showError(input, 'You must confirm this');
      return false;
    }
    clearError(input);
    return true;
  }

  // ---------- Превью фото ----------
  fileInputs.forEach(input => {
    input.addEventListener('change', () => {
      const label = input.closest('.photo-upload');
      if (!label) return;

      const oldPreview = label.querySelector('img.preview');
      if (oldPreview) oldPreview.remove();

      const file = input.files[0];
      if (!file) {
        label.classList.remove('filled');
        return;
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        showError(input, 'Allowed: JPG, PNG, WEBP');
        label.classList.add('error');
        label.classList.remove('filled');
        return;
      }
      if (file.size > MAX_SIZE) {
        showError(input, 'File is larger than 10 MB');
        label.classList.add('error');
        label.classList.remove('filled');
        return;
      }

      clearError(input);
      label.classList.remove('error');
      label.classList.add('filled');

      const reader = new FileReader();
      reader.onload = e => {
        const img = document.createElement('img');
        img.src = e.target.result;
        img.className = 'preview';
        img.alt = 'preview';
        label.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
  });

  // ---------- Полная валидация формы ----------
  function validateForm() {
    let valid = true;

    inputs.forEach(input => {
      if (!validateTextInput(input)) valid = false;
    });

    fileInputs.forEach(input => {
      if (!validateFile(input)) valid = false;
    });

    checkboxes.forEach(input => {
      if (!validateCheckbox(input)) valid = false;
    });

    return valid;
  }

  // ---------- Блокировка кнопки ----------
  function updateButtonState() {
    const allFilled = [...inputs].every(
      i => i.value.trim() !== '' && i.checkValidity()
    );
    const allFiles = [...fileInputs].every(i => i.files.length > 0);
    const allChecked = [...checkboxes].every(c => c.checked);

    submitBtn.disabled = !(allFilled && allFiles && allChecked);
  }

  // ---------- Слушатели ----------
  inputs.forEach(input => {
    input.addEventListener('input', () => {
      if (input.closest('.field')?.classList.contains('error')) {
        validateTextInput(input);
      }
      updateButtonState();
    });
    input.addEventListener('blur', () => validateTextInput(input));
  });

  checkboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.closest('.checkbox')?.classList.contains('error')) {
        validateCheckbox(cb);
      }
      updateButtonState();
    });
  });

  fileInputs.forEach(fi => {
    fi.addEventListener('change', updateButtonState);
  });

  // ---------- Сброс формы ----------
  function resetForm() {
    form.reset();

    document.querySelectorAll('.photo-upload').forEach(label => {
      label.classList.remove('filled', 'error');
      const preview = label.querySelector('img.preview');
      if (preview) preview.remove();
      const errorEl = label.querySelector('.field-error');
      if (errorEl) errorEl.textContent = '';
    });

    document.querySelectorAll('.field.error, .checkbox.error').forEach(el => {
      el.classList.remove('error');
      const errorEl = el.querySelector('.field-error');
      if (errorEl) errorEl.textContent = '';
    });

    const summary = form.querySelector('.form-error-summary, .form-success');
    if (summary) summary.textContent = '';

    updateButtonState();
  }

  // ---------- Отправка ----------
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    let summary = form.querySelector('.form-error-summary, .form-success');
    if (!summary) {
      summary = document.createElement('p');
      summary.className = 'form-error-summary';
      submitBtn.before(summary);
    }
    summary.className = 'form-error-summary';
    summary.textContent = '';

    // Валидация
    if (!validateForm()) {
      summary.textContent = 'Please fix the errors in the form.';
      const firstError = form.querySelector('.error');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // ============================================================
    // ⬇️ ОТПРАВКА ДАННЫХ НА СЕРВЕР
    // ============================================================
    try {
      submitBtn.disabled = true;
      summary.textContent = 'Sending...';

      const data = new FormData(form);
      const response = await fetch(SERVER_URL, {
        method: 'POST',
        body: data,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Server error');
      }

      // ===== УСПЕХ: Очищаем форму и показываем модальное окно =====
      resetForm();
      
      if (modal) {
        modal.classList.add('active');
        
        // Закрытие по кнопке (с защитой от дублирования событий)
        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.replaceWith(newCloseBtn);
        newCloseBtn.addEventListener('click', () => {
          modal.classList.remove('active');
        });
        
        // Закрытие по клику на темный фон
        modal.addEventListener('click', (event) => {
          if (event.target === modal) {
            modal.classList.remove('active');
          }
        }, { once: true }); // { once: true } чтобы не накапливались обработчики
      }

    } catch (err) {
      summary.className = 'form-error-summary';
      summary.textContent = err.message || 'Failed to send. Please try again later.';
    } finally {
      submitBtn.disabled = false;
      updateButtonState();
    }
  });

  // ---------- Инициализация ----------
  updateButtonState();
});