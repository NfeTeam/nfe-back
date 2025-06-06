const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const { all } = require('axios');
require('dotenv').config();

// Configure multer for memory storage instead of disk storage
const upload = multer({ storage: multer.memoryStorage() });

// Setup the Nodemailer transporter using Gmail's SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD,
  },
});

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_DATABASE_URL,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID,
  measurementId: process.env.REACT_APP_MEASUREMENT_ID,
};

// Export the handler for Vercel
module.exports = async (req, res) => {
  // Enable CORS
  const corsMiddleware = cors({
    origin: ['http://localhost:3000', 'https://nfe-web-inky.vercel.app', 'https://your-hostinger-domain.com'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  });

  // Apply CORS middleware
  await new Promise((resolve, reject) => {
    corsMiddleware(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });

  // Handle different routes
  if (req.method === 'GET' && req.url === '/api/firebase-config') {
    return res.status(200).json(firebaseConfig);
  }

  if (req.method === 'POST' && req.url === '/api/send-email') {
    try {
      // Handle file uploads
      const uploadMiddleware = upload.fields([{ name: 'resume' }, { name: 'cv' }]);
      await new Promise((resolve, reject) => {
        uploadMiddleware(req, res, (result) => {
          if (result instanceof Error) {
            return reject(result);
          }
          return resolve(result);
        });
      });

      const { email, name, jobTitle } = req.body;
      const resume = req.files['resume'][0];
      const cv = req.files['cv'][0];

      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: 'nfeteam24@gmail.com',
        subject: `Job Application: ${jobTitle} - ${name}`,
        text: `You have received a job application from ${name} (${email}) for the position of ${jobTitle}.`,
        attachments: [
          {
            filename: resume.originalname,
            content: resume.buffer,
          },
          {
            filename: cv.originalname,
            content: cv.buffer,
          },
        ],
      };

      await transporter.sendMail(mailOptions);
      return res.status(200).json({ message: 'Email sent successfully!' });
    } catch (error) {
      console.error('Error sending email:', error);
      return res.status(500).json({ error: 'Error sending email.' });
    }
  }

  // Handle 404 for undefined routes
  return res.status(404).json({ error: 'Not found' });
};

