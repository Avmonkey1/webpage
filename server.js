const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Serve the main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to convert LinkedIn profile to PDF
app.post('/api/generate-pdf', async (req, res) => {
  const { url } = req.body;

  // Validate LinkedIn URL
  if (!url) {
    return res.status(400).json({ error: 'LinkedIn URL is required' });
  }

  if (!url.includes('linkedin.com')) {
    return res.status(400).json({ error: 'Please provide a valid LinkedIn URL' });
  }

  let browser;
  try {
    console.log('Launching browser...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();

    // Set viewport for better rendering
    await page.setViewport({ width: 1200, height: 800 });

    console.log(`Navigating to: ${url}`);

    // Navigate to LinkedIn profile
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Wait a bit for any dynamic content to load
    await page.waitForTimeout(2000);

    console.log('Generating PDF...');

    // Generate PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });

    await browser.close();

    // Send PDF as response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=linkedin-profile.pdf');
    res.send(pdf);

    console.log('PDF generated successfully');

  } catch (error) {
    console.error('Error generating PDF:', error);

    if (browser) {
      await browser.close();
    }

    res.status(500).json({
      error: 'Failed to generate PDF',
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
