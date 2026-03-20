const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { uploadReport } = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.post('/upload', authMiddleware, upload.single('report'), uploadReport);

module.exports = router;