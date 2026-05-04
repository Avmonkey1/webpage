# LinkedIn to PDF Converter

A web application that converts LinkedIn profiles to PDF documents. Simply paste a LinkedIn profile URL and get a downloadable PDF version.

## Features

- Convert any public LinkedIn profile to PDF
- Clean and modern user interface
- Fast PDF generation using Puppeteer
- Instant download of generated PDFs
- Responsive design

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd webpage
```

2. Install dependencies:
```bash
npm install
```

## Usage

1. Start the server:
```bash
npm start
```

2. Open your browser and navigate to:
```
http://localhost:3000
```

3. Enter a LinkedIn profile URL (e.g., `https://www.linkedin.com/in/username`)

4. Click "Generate PDF" and wait for the download to complete

## How It Works

1. **Frontend**: A simple HTML form where users enter LinkedIn profile URLs
2. **Backend**: Express.js server with a REST API endpoint
3. **PDF Generation**: Puppeteer renders the LinkedIn page and converts it to PDF
4. **Download**: The PDF is sent back to the browser and automatically downloaded

## Project Structure

```
.
├── server.js           # Express server and API endpoints
├── package.json        # Project dependencies
├── public/             # Frontend files
│   ├── index.html     # Main HTML page
│   └── app.js         # Client-side JavaScript
└── README.md          # This file
```

## API Endpoints

### POST /api/generate-pdf
Generate a PDF from a LinkedIn profile URL.

**Request Body:**
```json
{
  "url": "https://www.linkedin.com/in/username"
}
```

**Response:**
- Success: PDF file (application/pdf)
- Error: JSON with error message

### GET /api/health
Health check endpoint.

**Response:**
```json
{
  "status": "OK",
  "message": "Server is running"
}
```

## Configuration

The server runs on port 3000 by default. You can change this by setting the PORT environment variable:

```bash
PORT=8080 npm start
```

## Important Notes

- This tool works best with public LinkedIn profiles
- LinkedIn may block automated access for some profiles
- PDF generation can take 10-30 seconds depending on profile complexity
- Make sure you have sufficient permissions to access the profiles you're converting

## Dependencies

- **express**: Web server framework
- **puppeteer**: Headless browser for PDF generation
- **cors**: Enable CORS for API requests

## Troubleshooting

**Problem: PDF generation fails**
- Ensure the LinkedIn URL is public and accessible
- Check your internet connection
- LinkedIn may have rate limiting or anti-scraping measures

**Problem: Server won't start**
- Make sure port 3000 is not in use
- Verify all dependencies are installed (`npm install`)
- Check Node.js version (should be v14+)

## License

MIT
