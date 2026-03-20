const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./src/db');
const authRoutes = require('./src/routes/authRoutes');
const healthRoutes = require('./src/routes/healthRoutes');
const reportRoutes = require('./src/routes/reportRoutes');
const chatRoutes = require('./src/routes/chatRoutes');

const app = express();

app.use(cors({
  origin: ['https://healthgenix.vercel.app', 'http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/chat', chatRoutes);

app.get('/', async (req, res) => {
  try {
    await pool.query('SELECT NOW()');
    res.json({ 
      message: 'HealthGenix API is running!',
      database: 'Connected ✅'
    });
  } catch (error) {
    res.json({ 
      message: 'HealthGenix API is running!',
      database: 'Not connected ❌'
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('HealthGenix server running on port ' + PORT);
});