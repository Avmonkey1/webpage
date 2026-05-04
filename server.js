require('dotenv').config();
const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const path = require('path');

puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Rate limiting: 5 requests per 15 minutes per IP to avoid LinkedIn IP bans
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests. Please wait 15 minutes before trying again.',
    type: 'rate_limited'
  }
});
app.use('/api/generate-pdf', limiter);

// Simple semaphore to cap concurrent Puppeteer instances (RAM protection)
let activeRequests = 0;
const MAX_CONCURRENT = 2;

class LinkedInAuthError extends Error {
  constructor(message) {
    super(message);
    this.name = 'LinkedInAuthError';
  }
}

const LINKEDIN_PROFILE_REGEX = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-_%]+\/?(\?.*)?$/;

async function injectLinkedInCookies(page) {
  const liAt = process.env.LINKEDIN_LI_AT_COOKIE;
  if (!liAt) return false;

  await page.setCookie(
    {
      name: 'li_at',
      value: liAt,
      domain: '.linkedin.com',
      path: '/',
      httpOnly: true,
      secure: true,
    },
    {
      name: 'JSESSIONID',
      value: process.env.LINKEDIN_JSESSIONID || '',
      domain: '.linkedin.com',
      path: '/',
      httpOnly: false,
      secure: true,
    }
  );
  return true;
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/generate-pdf', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'LinkedIn URL is required', type: 'invalid_url' });
  }

  // Normalize URL: strip query params that aren't needed
  let cleanUrl = url.trim();
  try {
    const parsed = new URL(cleanUrl);
    cleanUrl = `https://www.linkedin.com${parsed.pathname.replace(/\/$/, '')}`;
  } catch {
    // keep as-is
  }

  if (!LINKEDIN_PROFILE_REGEX.test(cleanUrl)) {
    return res.status(400).json({
      error: 'Invalid LinkedIn URL. Expected format: https://www.linkedin.com/in/username',
      type: 'invalid_url'
    });
  }

  if (activeRequests >= MAX_CONCURRENT) {
    return res.status(429).json({
      error: 'Server is busy processing another request. Please try again in a moment.',
      type: 'server_busy'
    });
  }

  activeRequests++;
  let browser;

  try {
    console.log(`[${new Date().toISOString()}] Starting PDF for: ${cleanUrl}`);

    browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--window-size=1920,1080',
      ]
    });

    const page = await browser.newPage();

    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Upgrade-Insecure-Requests': '1',
    });

    const hasCookies = await injectLinkedInCookies(page);

    // Without cookies, visit homepage first to appear as organic traffic
    if (!hasCookies) {
      await page.goto('https://www.linkedin.com', {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
      await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000));
    }

    await page.goto(cleanUrl, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Check if we landed on a login wall or error page
    const currentUrl = page.url();
    const pageTitle = await page.title();

    if (currentUrl.includes('/login') || currentUrl.includes('/authwall') || pageTitle.toLowerCase().includes('log in')) {
      throw new LinkedInAuthError(
        'LinkedIn requires login to view this profile. Set LINKEDIN_LI_AT_COOKIE in the .env file on your server.'
      );
    }

    if (currentUrl.includes('/checkpoint') || pageTitle.toLowerCase().includes('security check')) {
      throw new LinkedInAuthError(
        'LinkedIn triggered a security checkpoint. Try again later or configure authentication cookies.'
      );
    }

    if (pageTitle.includes('Page Not Found') || currentUrl.includes('/404')) {
      throw new Error('LinkedIn profile not found. Check the URL is correct and the profile exists.');
    }

    // Wait for main content
    try {
      await page.waitForSelector('main', { timeout: 10000 });
    } catch {
      // fall through — let PDF generate with whatever loaded
    }

    // Scroll to trigger lazy-loaded sections (Experience, Education, Skills)
    await new Promise(r => setTimeout(r, 1500));
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await new Promise(r => setTimeout(r, 800));
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise(r => setTimeout(r, 800));
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(r => setTimeout(r, 500));

    // Inject print CSS to clean up nav, banners, overlays
    await page.addStyleTag({
      content: `
        header, .global-nav, .scaffold-layout__sidebar-rail,
        .pv-open-to-widget, .ad-banner-container,
        .msg-overlay-list-bubble, .artdeco-toast-item,
        .scaffold-finite-scroll__load-button,
        footer { display: none !important; }
        .scaffold-layout__main { max-width: 100% !important; }
        .artdeco-card { break-inside: avoid; }
      `
    });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: false,
      margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' }
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=linkedin-profile.pdf');
    res.send(pdf);

    console.log(`[${new Date().toISOString()}] PDF generated successfully for: ${cleanUrl}`);

  } catch (error) {
    if (browser) await browser.close().catch(() => {});

    console.error(`[${new Date().toISOString()}] Error for ${cleanUrl}:`, error.message);

    if (error instanceof LinkedInAuthError) {
      return res.status(403).json({
        error: error.message,
        type: 'auth_required',
        help: 'Extract the li_at cookie from LinkedIn in Chrome (F12 → Application → Cookies) and set LINKEDIN_LI_AT_COOKIE in your .env file.'
      });
    }

    if (error.message?.includes('timeout')) {
      return res.status(504).json({
        error: 'LinkedIn took too long to respond. The profile may be private or LinkedIn may be rate-limiting. Try again in a few minutes.',
        type: 'timeout'
      });
    }

    res.status(500).json({
      error: 'Failed to generate PDF',
      type: 'server_error',
      details: error.message
    });

  } finally {
    activeRequests--;
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    authenticated: !!process.env.LINKEDIN_LI_AT_COOKIE,
    message: 'Server is running'
  });
});

app.listen(PORT, () => {
  const authStatus = process.env.LINKEDIN_LI_AT_COOKIE ? 'authenticated' : 'anonymous (set LINKEDIN_LI_AT_COOKIE for best results)';
  console.log(`Server running on http://localhost:${PORT} — LinkedIn mode: ${authStatus}`);
});
