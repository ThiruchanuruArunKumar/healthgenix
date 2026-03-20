const chat = async (req, res) => {
  try {
    const { message, healthData } = req.body;

    const prompt = `You are HealthGenix AI Assistant — a friendly health advisor.
${healthData ? `User health data:
- Wellbeing Score: ${healthData.wellbeing_score}/100
- Diabetes Risk: ${healthData.diabetes_risk}%
- Cardiovascular Risk: ${healthData.cardiovascular_risk}%
- Hypertension Risk: ${healthData.hypertension_risk}%` : ''}

Answer this health question helpfully with emojis: ${message}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1024
      })
    });

    const data = await response.json();
    console.log('Status:', response.status);

    if (data.choices && data.choices[0]) {
      res.json({ reply: data.choices[0].message.content });
    } else {
      console.log('Full response:', JSON.stringify(data));
      res.status(500).json({ message: 'No response', data });
    }

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ message: 'Chat error', error: error.message });
  }
};

module.exports = { chat };