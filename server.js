require('dotenv').config();
const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const fs = require('fs/promises');
const crypto = require('crypto');
const { fileTypeFromBuffer } = require('file-type'); // <-- ИСПРАВЛЕНО: современный импорт
const xss = require('xss');

const app = express();

// --- 1. CORS ---
const allowedOrigins = [
  'http://localhost:5500', 
  'http://127.0.0.1:5500', 
  'http://localhost:8000', 
  'http://127.0.0.1:8000'
  // 'https://ваш-будущий-домен.com'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

// --- 2. Безопасность ---
app.use(helmet());
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

// --- 3. Rate Limiting ---
const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many attempts. Please try again later.' },
});
app.use('/submit-form', formLimiter);

// --- 4. Multer ---
const upload = multer({
  dest: 'temp_uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 3,
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type. Allowed: JPG, PNG, WEBP.'));
  },
});

// --- 5. Nodemailer ---
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.verify((error) => {
  if (error) console.error('❌ SMTP connection failed:', error.message);
  else console.log('✅ SMTP is ready to send emails');
});

// --- 6. Маршрут приёма формы ---
app.post(
  '/submit-form',
  upload.fields([
    { name: 'photo1', maxCount: 1 },
    { name: 'photo2', maxCount: 1 },
    { name: 'photo3', maxCount: 1 },
  ]),
  async (req, res) => {
    const body = req.body || {};
    const files = req.files || {};

    const allFiles = [
      ...(files.photo1 || []),
      ...(files.photo2 || []),
      ...(files.photo3 || []),
    ];

    try {
      // ===== ПРОВЕРКА 1: Текстовые поля =====
      const requiredFields = [
        'firstName', 'lastName', 'dob', 'location', 'phone', 'email',
        'instagram', 'height', 'chest', 'waist', 'hips', 'shoeSize',
        'tattoos', 'scars',
      ];
      for (const field of requiredFields) {
        if (!body[field] || String(body[field]).trim() === '') {
          throw new Error(`Field "${field}" is required.`);
        }
      }
      if (!body.agree1 || !body.agree2) {
        throw new Error('Both agreements must be confirmed.');
      }

      // ===== ПРОВЕРКА 2: Файлы (Магические байты) =====
      if (allFiles.length !== 3) {
        throw new Error('Exactly 3 photos are required.');
      }

      const allowedSignatures = ['image/jpeg', 'image/png', 'image/webp'];
      for (const file of allFiles) {
        const buffer = await fs.readFile(file.path);
        // ИСПРАВЛЕНО: используем импортированную функцию fileTypeFromBuffer
        const type = await fileTypeFromBuffer(buffer);
        
        if (!type || !allowedSignatures.includes(type.mime)) {
          throw new Error('One of the files is not a valid image (JPG, PNG, WEBP).');
        }
      }

      // ===== ПРОВЕРКА 3: XSS Очистка =====
      const cleanBody = {};
      for (const key in body) {
        if (typeof body[key] === 'string') {
          cleanBody[key] = xss(body[key]);
        } else {
          cleanBody[key] = body[key];
        }
      }

      // ===== ОТПРАВКА ПИСЬМА =====
      const mailOptions = {
        from: `"The Cast Form" <${process.env.SMTP_USER}>`,
        to: process.env.TO_EMAIL,
        subject: `New application from ${cleanBody.firstName} ${cleanBody.lastName}`,
        text: `
First name: ${cleanBody.firstName}
Last name: ${cleanBody.lastName}
Date of birth: ${cleanBody.dob}
Location: ${cleanBody.location}
Phone: ${cleanBody.phone}
E-mail: ${cleanBody.email}
Instagram: ${cleanBody.instagram}
Height: ${cleanBody.height}
Chest: ${cleanBody.chest}
Waist: ${cleanBody.waist}
Hips: ${cleanBody.hips}
Shoe size: ${cleanBody.shoeSize}
Tattoos: ${cleanBody.tattoos}
Scars / piercing: ${cleanBody.scars}
        `.trim(),
        attachments: allFiles.map(file => ({
          filename: `${crypto.randomBytes(8).toString('hex')}.jpg`,
          path: file.path,
        })),
      };

      await transporter.sendMail(mailOptions);

      // Очистка временных файлов
      await Promise.all(allFiles.map(f => fs.unlink(f.path).catch(() => {})));
      res.status(200).json({ message: 'Application sent successfully!' });

    } catch (error) {
      // Очистка файлов даже при ошибке
      await Promise.all(allFiles.map(f => fs.unlink(f.path).catch(() => {})));
      console.error('❌ Form error:', error.message);
      res.status(400).json({ message: error.message || 'Error processing application.' });
    }
  }
);

// --- Запуск ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});