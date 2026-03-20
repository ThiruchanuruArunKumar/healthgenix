const pool = require('../db');

// Save health parameters
const saveHealthData = async (req, res) => {
  try {
    const userId = req.user.id;
    const { parameters } = req.body;

    // Create health entry
    const entry = await pool.query(
      'INSERT INTO health_entries (user_id) VALUES ($1) RETURNING *',
      [userId]
    );

    const entryId = entry.rows[0].id;

    // Save each parameter
    for (const param of parameters) {
      await pool.query(
        'INSERT INTO health_parameters (entry_id, param_name, param_value, unit) VALUES ($1, $2, $3, $4)',
        [entryId, param.name, param.value, param.unit]
      );
    }

    // Calculate risk scores
    const riskScores = calculateRiskScores(parameters);

    // Save risk scores
    await pool.query(
      'INSERT INTO risk_scores (user_id, wellbeing_score, diabetes_risk, cardiovascular_risk, hypertension_risk) VALUES ($1, $2, $3, $4, $5)',
      [userId, riskScores.wellbeing, riskScores.diabetes, riskScores.cardiovascular, riskScores.hypertension]
    );

    res.json({
      message: 'Health data saved successfully',
      entryId,
      riskScores
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get latest health data
const getHealthData = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get latest risk scores
    const riskScores = await pool.query(
      'SELECT * FROM risk_scores WHERE user_id = $1 ORDER BY calculated_at DESC LIMIT 1',
      [userId]
    );

    // Get latest health entry parameters
    const latestEntry = await pool.query(
      'SELECT * FROM health_entries WHERE user_id = $1 ORDER BY entry_date DESC LIMIT 1',
      [userId]
    );

    let parameters = [];
    if (latestEntry.rows.length > 0) {
      const params = await pool.query(
        'SELECT * FROM health_parameters WHERE entry_id = $1',
        [latestEntry.rows[0].id]
      );
      parameters = params.rows;
    }

    res.json({
      riskScores: riskScores.rows[0] || null,
      parameters
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Risk calculation engine
const calculateRiskScores = (parameters) => {
  let wellbeing = 70;
  let diabetes = 20;
  let cardiovascular = 15;
  let hypertension = 15;

  parameters.forEach(param => {
    const value = parseFloat(param.value);

    // Fasting glucose
    if (param.name === 'fasting_glucose') {
      if (value > 126) { diabetes += 30; wellbeing -= 15; }
      else if (value > 100) { diabetes += 15; wellbeing -= 8; }
      else { diabetes -= 5; wellbeing += 5; }
    }

    // BMI
    if (param.name === 'bmi') {
      if (value > 30) { diabetes += 20; cardiovascular += 15; wellbeing -= 10; }
      else if (value > 25) { diabetes += 10; cardiovascular += 8; wellbeing -= 5; }
      else { wellbeing += 5; }
    }

    // Systolic blood pressure
    if (param.name === 'systolic_bp') {
      if (value > 140) { hypertension += 35; cardiovascular += 20; wellbeing -= 15; }
      else if (value > 120) { hypertension += 15; cardiovascular += 10; wellbeing -= 5; }
      else { wellbeing += 5; }
    }

    // Sleep hours
    if (param.name === 'sleep_hours') {
      if (value < 6) { wellbeing -= 10; diabetes += 8; }
      else if (value >= 7 && value <= 9) { wellbeing += 8; }
    }

    // Exercise days
    if (param.name === 'exercise_days') {
      if (value >= 4) { wellbeing += 10; cardiovascular -= 8; diabetes -= 8; }
      else if (value >= 2) { wellbeing += 5; }
      else { wellbeing -= 8; cardiovascular += 10; }
    }

    // Stress level
    if (param.name === 'stress_level') {
      if (value >= 8) { wellbeing -= 15; cardiovascular += 10; }
      else if (value >= 5) { wellbeing -= 5; }
    }

    // Cholesterol
    if (param.name === 'cholesterol') {
      if (value > 240) { cardiovascular += 25; wellbeing -= 10; }
      else if (value > 200) { cardiovascular += 12; wellbeing -= 5; }
    }
  });

  // Keep values in range 0-100
  return {
    wellbeing: Math.min(100, Math.max(0, Math.round(wellbeing))),
    diabetes: Math.min(100, Math.max(0, Math.round(diabetes))),
    cardiovascular: Math.min(100, Math.max(0, Math.round(cardiovascular))),
    hypertension: Math.min(100, Math.max(0, Math.round(hypertension)))
  };
};
const getHealthHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT * FROM risk_scores WHERE user_id = $1 ORDER BY calculated_at DESC',
      [userId]
    );
    res.json({ history: result.rows });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { saveHealthData, getHealthData, getHealthHistory };