const fs = require('fs');

const extractParameters = (text) => {
  const parameters = [];

  const patterns = [
    { name: 'fasting_glucose', unit: 'mg/dL', regex: /(?:fasting\s*(?:blood\s*)?(?:glucose|sugar)|fbs)[:\s]+(\d+\.?\d*)/i },
    { name: 'total_cholesterol', unit: 'mg/dL', regex: /total\s*cholesterol[:\s]+(\d+\.?\d*)/i },
    { name: 'hdl', unit: 'mg/dL', regex: /hdl[:\s]+(\d+\.?\d*)/i },
    { name: 'ldl', unit: 'mg/dL', regex: /ldl[:\s]+(\d+\.?\d*)/i },
    { name: 'hba1c', unit: '%', regex: /hba1c[:\s]+(\d+\.?\d*)/i },
    { name: 'systolic_bp', unit: 'mmHg', regex: /systolic[:\s]+(\d+)/i },
    { name: 'creatinine', unit: 'mg/dL', regex: /creatinine[:\s]+(\d+\.?\d*)/i },
    { name: 'tsh', unit: 'mIU/L', regex: /tsh[:\s]+(\d+\.?\d*)/i },
    { name: 'hemoglobin', unit: 'g/dL', regex: /h(?:a?e)?moglobin[:\s]+(\d+\.?\d*)/i }
  ];

  patterns.forEach(param => {
    const match = text.match(param.regex);
    if (match) {
      parameters.push({
        name: param.name,
        value: parseFloat(match[1]),
        unit: param.unit,
        confidence: 'high'
      });
    }
  });

  return parameters;
};

const uploadReport = async (req, res) => {
  try {
    console.log('Upload request received');

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileType = req.file.mimetype;
    console.log('File type:', fileType);

    let parameters = [];

    if (fileType === 'application/pdf') {
      // Dynamically import pdfjs-dist
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
      const data = new Uint8Array(fs.readFileSync(filePath));
      const pdfDocument = await pdfjsLib.getDocument({ data }).promise;
      
      let fullText = '';
      for (let i = 1; i <= pdfDocument.numPages; i++) {
        const page = await pdfDocument.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
      }

      console.log('Extracted text:', fullText.substring(0, 200));
      parameters = extractParameters(fullText);
    }

    // Clean up file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    console.log('Parameters found:', parameters.length);

    res.json({
      message: parameters.length > 0 ? 'Report processed successfully' : 'File processed but no parameters found',
      parameters,
      totalFound: parameters.length
    });

  } catch (error) {
    console.error('Report upload error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

module.exports = { uploadReport };