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

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });


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
