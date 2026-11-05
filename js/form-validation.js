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
  
  const phoneInput = document.getElementById('phone-input');
  const phoneCountry = document.getElementById('phone-country');

  // Инициализация: ставим плюс при загрузке
  if (phoneInput && phoneInput.value.trim() === '') {
    phoneInput.value = '+';
  }

  // ---------- Элементы модального окна ----------
  const modal = document.getElementById('successModal');
  const closeBtn = document.getElementById('closeSuccessBtn');

  // ---------- Константы ----------
  const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const SERVER_URL = 'http://localhost:3000/submit-form';

  // ---------- Логика определения страны и формата телефона ----------
  if (phoneInput && window.libphonenumber) {
    let isValidLocked = false; // Флаг: номер уже стал валидным
    let lastValue = '+';

    phoneInput.addEventListener('input', (e) => {
      let value = e.target.value;
      
      // Если стоит блокировка, но пользователь пытается добавить цифру в конец (а не стереть)
      if (isValidLocked) {
        const currentDigits = value.replace(/[^\d]/g, '');
        const lastDigits = lastValue.replace(/[^\d]/g, '');
        
        // Если цифр стало больше, значит пытаемся ввести лишнее — откат
        if (currentDigits.length > lastDigits.length) {
           e.target.value = lastValue;
           return;
        } else {
           // Если стирают, снимаем блокировку
           isValidLocked = false; 
        }
      }

      let digits = value.replace(/[^\d+]/g, '');
      
      if (!digits) {
        phoneCountry.textContent = '';
        e.target.value = '+';
        lastValue = '+';
        return;
      }

      // Автозамена 8 на +7
      if (digits.startsWith('8') && !digits.startsWith('+')) {
        digits = '+7' + digits.slice(1);
      } else if (!digits.startsWith('+')) {
        digits = '+' + digits;
      }

      try {
        const phoneNumber = window.libphonenumber.parsePhoneNumberFromString(digits);
        
        if (phoneNumber) {
          phoneCountry.textContent = phoneNumber.country || '';
          
          // Форматируем на лету
          const formatter = new window.libphonenumber.AsYouType();
          const formattedValue = formatter.input(digits);
          e.target.value = formattedValue;
          
          // Если номер стал валидным — ставим блокировку и делаем красивый формат
          if (phoneNumber.isValid()) {
            isValidLocked = true;
            lastValue = phoneNumber.formatInternational();
            e.target.value = lastValue; 
          } else {
            lastValue = formattedValue;
          }
        }
      } catch (err) {
        e.target.value = lastValue;
      }
    });
    
    // При потере фокуса делаем финальную проверку
    phoneInput.addEventListener('blur', () => {
      let value = phoneInput.value;
      if (value === '+' || value === '') {
         phoneInput.value = '+';
         return;
      }
      
      try {
        const phoneNumber = window.libphonenumber.parsePhoneNumberFromString(value);
        if (phoneNumber && phoneNumber.isValid()) {
          phoneInput.value = phoneNumber.formatInternational();
          lastValue = phoneInput.value;
          isValidLocked = true;
        }
      } catch(e) {}
      
      validateTextInput(phoneInput);
    });
  }

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

    if (!value || (input.name === 'phone' && value === '+')) {
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

    // ===== PHONE (International Validation) =====
    if (input.name === 'phone') {
      if (window.libphonenumber) {
        try {
          const phoneNumber = window.libphonenumber.parsePhoneNumberFromString(value);
          if (!phoneNumber || !phoneNumber.isValid()) {
            showError(input, 'Invalid phone number for the selected country');
            return false;
          }
        } catch (e) {
          showError(input, 'Invalid phone format');
          return false;
        }
      } else {
        const digits = value.replace(/[\s\-\(\)]/g, '');
        if (!/^\+\d{10,15}$/.test(digits)) {
          showError(input, 'Include "+" and country code (10-15 digits)');
          return false;
        }
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
    const field = input.closest('.photo-upload');

    if (!file) {
      if (field) field.classList.add('error');
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

    if (field) field.classList.remove('error');
    return true;
  }

  // ---------- Валидация чекбоксов ----------
  function validateCheckbox(input) {
    if (!input.checked) {
      showError(input, 'Required');
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

  // ---------- Слушатели ----------
  inputs.forEach(input => {
    input.addEventListener('input', () => {
      if (input.closest('.field')?.classList.contains('error')) {
        validateTextInput(input);
      }
    });
    input.addEventListener('blur', () => {
        if (input.name !== 'phone') validateTextInput(input);
    });
  });

  checkboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.closest('.checkbox')?.classList.contains('error')) {
        validateCheckbox(cb);
      }
    });
  });

  // ---------- Сброс формы ----------
  function resetForm() {
    form.reset();
    if (phoneCountry) phoneCountry.textContent = '';
    if (phoneInput) phoneInput.value = '+'; // Возвращаем плюс после сброса

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

    if (!validateForm()) {
      summary.textContent = 'Make sure all fields, photos and checkboxes are filled.';
      const firstError = form.querySelector('.error');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

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

      // УСПЕХ
      resetForm();
      
      if (modal) {
        modal.classList.add('active');
        
        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.replaceWith(newCloseBtn);
        newCloseBtn.addEventListener('click', () => {
          modal.classList.remove('active');
        });
        
        modal.addEventListener('click', (event) => {
          if (event.target === modal) {
            modal.classList.remove('active');
          }
        }, { once: true });
      }

    } catch (err) {
      summary.className = 'form-error-summary';
      summary.textContent = err.message || 'Failed to send. Please try again later.';
    } finally {
      submitBtn.disabled = false;
    }
  });
});