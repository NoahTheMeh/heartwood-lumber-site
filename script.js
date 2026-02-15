// ===========================
// HEARTWOOD LUMBER CO. — Scripts
// ===========================

document.addEventListener('DOMContentLoaded', () => {

  // --- Mobile Navigation Toggle ---
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navLinks.classList.toggle('active');
  });

  // Close mobile nav when a link is clicked
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('active');
      navLinks.classList.remove('active');
    });
  });


  // --- Navbar scroll shadow ---
  const navbar = document.getElementById('navbar');


  // --- Active nav link highlighting ---
  const sections = document.querySelectorAll('.section, .hero');
  const navItems = document.querySelectorAll('.nav-links a');

  const observerOptions = {
    root: null,
    rootMargin: '-30% 0px -70% 0px',
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navItems.forEach(item => {
          item.classList.remove('active-link');
          if (item.getAttribute('href') === `#${id}`) {
            item.classList.add('active-link');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach(section => observer.observe(section));


  // --- Scroll-triggered fade-in animations ---
  const animateElements = document.querySelectorAll(
    '.product-card, .gallery-item, .testimonial-card, .process-step, .about-grid, .faq-item'
  );

  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in-visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  animateElements.forEach(el => {
    el.classList.add('fade-in');
    fadeObserver.observe(el);
  });


  // --- Back to Top button ---
  const backToTop = document.getElementById('backToTop');

  // Combined scroll handler for navbar + back-to-top
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    navbar.classList.toggle('scrolled', y > 50);
    backToTop.classList.toggle('visible', y > 600);
  });

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });


  // --- Lightbox ---
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');

  const galleryItems = document.querySelectorAll('.gallery-item');
  let currentIndex = 0;

  function openLightbox(index) {
    currentIndex = index;
    const item = galleryItems[index];
    const img = item.querySelector('.gallery-img');
    const caption = item.querySelector('.gallery-caption');

    // Use a higher-res version for the lightbox
    lightboxImg.src = img.src.replace(/w=\d+/, 'w=1400');
    lightboxImg.alt = img.alt;
    lightboxCaption.textContent = caption ? caption.textContent : '';
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  function navigate(direction) {
    currentIndex = (currentIndex + direction + galleryItems.length) % galleryItems.length;
    openLightbox(currentIndex);
  }

  galleryItems.forEach((item, index) => {
    item.addEventListener('click', () => openLightbox(index));
  });

  lightboxClose.addEventListener('click', closeLightbox);
  lightboxPrev.addEventListener('click', () => navigate(-1));
  lightboxNext.addEventListener('click', () => navigate(1));

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigate(-1);
    if (e.key === 'ArrowRight') navigate(1);
  });


  // --- Contact form handling ---
  const form = document.querySelector('.contact-form');

  form.addEventListener('submit', (e) => {
    const action = form.getAttribute('action');

    // If email isn't configured, prevent submission and show a message
    if (action.includes('YOUR_EMAIL@example.com')) {
      e.preventDefault();
      alert('Contact form is not yet connected.\n\nReplace YOUR_EMAIL@example.com in index.html with the real email address.');
    }
  });

});
