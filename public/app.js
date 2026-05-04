const STEPS = [
  { id: 'step-1', delay: 0,     label: 'Launching secure browser...' },
  { id: 'step-2', delay: 4000,  label: 'Loading LinkedIn profile...' },
  { id: 'step-3', delay: 9000,  label: 'Waiting for content to load...' },
  { id: 'step-4', delay: 15000, label: 'Capturing all profile sections...' },
  { id: 'step-5', delay: 22000, label: 'Generating PDF document...' },
];

let stepTimers = [];

function startProgressSteps() {
  STEPS.forEach((step, i) => {
    const t = setTimeout(() => {
      // Mark previous step done
      if (i > 0) {
        document.getElementById(STEPS[i - 1].id).className = 'step done';
      }
      document.getElementById(step.id).className = 'step active';
      document.getElementById('spinnerLabel').textContent = step.label;
    }, step.delay);
    stepTimers.push(t);
  });
}

function stopProgressSteps() {
  stepTimers.forEach(clearTimeout);
  stepTimers = [];
}

function resetSteps() {
  STEPS.forEach(s => {
    document.getElementById(s.id).className = 'step';
  });
}

function showMessage(text, type, helpText) {
  const el = document.getElementById('message');
  el.innerHTML = text;
  if (helpText) {
    el.innerHTML += `<div class="help-text">${helpText}</div>`;
  }
  el.className = `message active ${type}`;
}

function normalizeLinkedInUrl(input) {
  try {
    const parsed = new URL(input.trim());
    return `https://www.linkedin.com${parsed.pathname.replace(/\/$/, '')}`;
  } catch {
    return input.trim();
  }
}

// Check server status on load
async function checkServerStatus() {
  const dot = document.getElementById('statusDot');
  const text = document.getElementById('statusText');
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    if (data.authenticated) {
      dot.className = 'status-dot auth';
      text.textContent = 'Server online — Authenticated mode';
    } else {
      dot.className = 'status-dot online';
      text.textContent = 'Server online — Anonymous mode (see below for better results)';
    }
  } catch {
    dot.className = 'status-dot offline';
    text.textContent = 'Cannot reach server';
  }
}

document.addEventListener('DOMContentLoaded', function () {
  checkServerStatus();

  const form = document.getElementById('pdfForm');
  const loader = document.getElementById('loader');
  const submitBtn = document.getElementById('submitBtn');

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const rawUrl = document.getElementById('linkedinUrl').value;
    const url = normalizeLinkedInUrl(rawUrl);

    if (!url.includes('linkedin.com/in/')) {
      showMessage('Please enter a valid LinkedIn profile URL (linkedin.com/in/username)', 'error');
      return;
    }

    // Show loader
    loader.classList.add('active');
    document.getElementById('message').className = 'message';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Generating...';
    resetSteps();
    startProgressSteps();

    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      if (!response.ok) {
        const err = await response.json();

        if (err.type === 'auth_required') {
          showMessage(
            'LinkedIn requires login to view this profile.',
            'error',
            err.help || 'See the instructions below to configure LinkedIn cookies on your server.'
          );
        } else if (err.type === 'timeout') {
          showMessage('LinkedIn took too long to respond. The profile may be private, or LinkedIn is rate-limiting your server IP. Try again in a few minutes.', 'error');
        } else if (err.type === 'server_busy') {
          showMessage('Server is busy with another request. Please wait 30 seconds and try again.', 'error');
        } else if (err.type === 'rate_limited') {
          showMessage('Too many requests. Please wait 15 minutes before trying again.', 'error');
        } else {
          showMessage(err.error || 'Failed to generate PDF. Please try again.', 'error');
        }
        return;
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `linkedin-profile-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      showMessage('PDF downloaded successfully!', 'success');

    } catch (error) {
      showMessage('Could not connect to the server. Make sure it is running.', 'error');
    } finally {
      stopProgressSteps();
      loader.classList.remove('active');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Generate PDF';
      resetSteps();
    }
  });
});
