# William Lodge Website

A professional, modern website for williamlodge.com featuring a clean design, smooth animations, and full responsiveness.

## Features

- **Modern Design**: Clean, professional aesthetic with elegant color scheme
- **Fully Responsive**: Works seamlessly on desktop, tablet, and mobile devices
- **Smooth Animations**: Scroll animations and transitions for engaging user experience
- **Interactive Gallery**: Click-to-expand image gallery
- **Contact Form**: Built-in contact form with validation
- **Mobile Navigation**: Hamburger menu for mobile devices
- **Parallax Effects**: Subtle parallax scrolling on hero section
- **SEO Optimized**: Semantic HTML and proper meta tags

## Sections

1. **Hero Section**: Eye-catching landing with call-to-action buttons
2. **About Section**: Information about William Lodge with imagery
3. **Services Section**: Six service cards with icons and descriptions
4. **Gallery Section**: Grid layout of beautiful images
5. **Contact Section**: Contact information and form
6. **Footer**: Social links and copyright

## Technologies Used

- HTML5
- CSS3 (with CSS Grid and Flexbox)
- Vanilla JavaScript (no dependencies)
- Unsplash images (placeholder images)

## File Structure

```
williamlodge/
├── index.html      # Main HTML file with embedded CSS
├── script.js       # JavaScript for interactivity
└── README.md       # This file
```

## Setup

1. Simply open `index.html` in a web browser
2. No build process or dependencies required
3. All styles are embedded in the HTML file
4. JavaScript is in a separate `script.js` file

## Customization

### Colors

The color scheme is defined in CSS custom properties (variables) in the `:root` selector:

```css
:root {
    --primary-color: #2c5f4f;    /* Main green */
    --secondary-color: #8b7355;   /* Brown accent */
    --accent-color: #d4a574;      /* Gold accent */
    --dark-color: #1a1a1a;        /* Dark background */
    --light-color: #f8f9fa;       /* Light background */
    --text-color: #333;           /* Text color */
}
```

### Images

Replace the Unsplash placeholder URLs with your own images:

- Hero background: Line 70 in the `.hero` section
- About section image: Line 229 in the `.about-image` section
- Gallery images: Lines 592-597 in the gallery section

### Content

Edit the following sections in `index.html`:

- Navigation links (line 244-250)
- Hero text (line 257-259)
- About text (line 273-277)
- Service cards (line 295-338)
- Contact information (line 370-393)
- Footer social links (line 418-423)

### Contact Form

The contact form currently shows an alert message. To make it functional:

1. Set up a backend endpoint to receive form submissions
2. Modify the form submission handler in `script.js` (lines 46-65)
3. Add your API endpoint and handle the response

Example:
```javascript
fetch('YOUR_API_ENDPOINT', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
})
.then(response => response.json())
.then(data => {
    alert('Thank you for your message!');
    contactForm.reset();
});
```

## Features Breakdown

### Mobile Menu
- Hamburger menu appears on screens < 768px
- Animated toggle effect
- Closes automatically when link is clicked

### Scroll Effects
- Navbar becomes more opaque on scroll
- Service cards and gallery items fade in on scroll
- Parallax effect on hero background

### Gallery
- Click any image to view full-size
- Modal overlay with centered image
- Click anywhere to close modal

### Smooth Scrolling
- All anchor links scroll smoothly
- Accounts for fixed navbar height

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## Performance

- No external dependencies
- Optimized images (use compressed images in production)
- Minimal JavaScript
- CSS animations use GPU acceleration

## Deployment

### GitHub Pages
1. Push to GitHub repository
2. Enable GitHub Pages in repository settings
3. Select main branch and /williamlodge folder

### Netlify
1. Drag and drop the williamlodge folder to Netlify
2. Or connect your GitHub repository

### Traditional Hosting
1. Upload all files to your web host
2. Point your domain to the folder
3. Ensure index.html is recognized as the default page

## Future Enhancements

- Add backend for contact form
- Integrate with CMS for easy content updates
- Add more gallery categories
- Implement image lazy loading
- Add testimonials section
- Integrate booking system
- Add blog section
- Implement multilingual support

## License

MIT License - feel free to use and modify for your needs

## Support

For questions or issues, please contact the development team.

---

**Note**: Replace placeholder images with actual images and update contact information before deploying to production.
