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
  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in-visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  // Observe static elements
  document.querySelectorAll(
    '.gallery-item, .testimonial-card, .process-step, .about-grid, .faq-item'
  ).forEach(el => {
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
  const form = document.getElementById('contactForm');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = 'Sending...';
    btn.disabled = true;

    try {
      const data = Object.fromEntries(new FormData(form));
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();

      if (res.ok) {
        form.reset();
        btn.textContent = 'Message Sent!';
        setTimeout(() => { btn.textContent = originalText; btn.disabled = false; }, 3000);
      } else {
        alert(result.error || 'Something went wrong. Please try again.');
        btn.textContent = originalText;
        btn.disabled = false;
      }
    } catch {
      alert('Unable to send message. Please email us directly at sawmillsolutionsllc@gmail.com');
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });


  // --- Dynamic Inventory ---
  const inventoryGrid = document.getElementById('inventoryGrid');
  const inventoryFilters = document.getElementById('inventoryFilters');

  if (inventoryGrid) {
    loadCategories();
    loadInventory('');
  }

  async function loadCategories() {
    try {
      const res = await fetch('/api/categories');
      const categories = await res.json();
      renderFilterButtons(categories);
    } catch { /* filter buttons just won't appear */ }
  }

  function renderFilterButtons(categories) {
    const allBtn = document.createElement('button');
    allBtn.className = 'filter-btn active';
    allBtn.dataset.category = '';
    allBtn.textContent = 'All';
    inventoryFilters.appendChild(allBtn);

    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn';
      btn.dataset.category = cat.slug;
      btn.textContent = cat.name;
      inventoryFilters.appendChild(btn);
    });

    inventoryFilters.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      inventoryFilters.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadInventory(btn.dataset.category);
    });
  }

  async function loadInventory(category) {
    inventoryGrid.innerHTML = '<p class="loading-message">Loading inventory...</p>';
    try {
      let url = '/api/inventory';
      if (category) url += '?category=' + encodeURIComponent(category);
      const res = await fetch(url);
      const items = await res.json();
      renderInventoryItems(items);
    } catch {
      inventoryGrid.innerHTML = '<p class="empty-state">Unable to load inventory. Please try again later.</p>';
    }
  }

  function renderInventoryItems(items) {
    if (items.length === 0) {
      inventoryGrid.innerHTML = '<p class="empty-state">No items found in this category.</p>';
      return;
    }

    inventoryGrid.innerHTML = items.map(item => `
      <div class="product-card ${item.in_stock ? '' : 'out-of-stock'}">
        ${item.image_url
          ? `<img src="${escapeAttr(item.image_url)}" alt="${escapeAttr(item.name)}" class="product-img" loading="lazy">`
          : '<div class="product-img" style="background:var(--color-sand);display:flex;align-items:center;justify-content:center;color:var(--color-tan);font-size:0.9rem;">No Image</div>'
        }
        <div class="product-info">
          <h3>${escapeHtml(item.name)}</h3>
          <p>${escapeHtml(item.description)}</p>
          <div class="product-price">$${Number(item.price).toFixed(2)}</div>
          <span class="stock-badge ${item.in_stock ? 'in-stock' : 'out-of-stock'}">
            ${item.in_stock ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>
      </div>
    `).join('');

    // Re-observe new cards for fade-in animation
    inventoryGrid.querySelectorAll('.product-card').forEach(el => {
      el.classList.add('fade-in');
      fadeObserver.observe(el);
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return (str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

});
