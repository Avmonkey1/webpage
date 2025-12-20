document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('pdfForm');
    const loader = document.getElementById('loader');
    const message = document.getElementById('message');
    const submitBtn = document.getElementById('submitBtn');
    const urlInput = document.getElementById('linkedinUrl');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const linkedinUrl = urlInput.value.trim();

        // Validate URL
        if (!linkedinUrl) {
            showMessage('Please enter a LinkedIn URL', 'error');
            return;
        }

        if (!linkedinUrl.includes('linkedin.com')) {
            showMessage('Please enter a valid LinkedIn URL', 'error');
            return;
        }

        // Show loader and disable button
        loader.classList.add('active');
        message.classList.remove('active');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Generating...';

        try {
            const response = await fetch('/api/generate-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: linkedinUrl })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate PDF');
            }

            // Get the PDF blob
            const blob = await response.blob();

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `linkedin-profile-${Date.now()}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            showMessage('PDF generated successfully! Check your downloads.', 'success');

        } catch (error) {
            console.error('Error:', error);
            showMessage(error.message || 'An error occurred while generating the PDF. Please try again.', 'error');
        } finally {
            // Hide loader and re-enable button
            loader.classList.remove('active');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Generate PDF';
        }
    });

    function showMessage(text, type) {
        message.textContent = text;
        message.className = 'message active ' + type;
    }
});
