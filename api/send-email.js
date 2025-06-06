const nodemailer = require('nodemailer');
const multer = require('multer');
const cors = require('cors');
require('dotenv').config();

const upload = multer({ storage: multer.memoryStorage() });

module.exports = async (req, res) => {
  // Enable CORS
  const corsMiddleware = cors({
    origin: '*',
    methods: ['POST'],
    allowedHeaders: ['Content-Type'],
  });
  await new Promise((resolve, reject) => {
    corsMiddleware(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const uploadMiddleware = upload.fields([{ name: 'resume' }, { name: 'cv' }]);
    await new Promise((resolve, reject) => {
      uploadMiddleware(req, res, (result) => {
        if (result instanceof Error) return reject(result);
        return resolve(result);
      });
    });

    const { email, name, jobTitle } = req.body;
    const resume = req.files['resume'][0];
    const cv = req.files['cv'][0];

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
      },
    });

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
}; 