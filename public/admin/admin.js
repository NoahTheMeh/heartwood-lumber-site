// ===========================
// HEARTWOOD LUMBER — Admin Panel
// ===========================

document.addEventListener('DOMContentLoaded', () => {

  // --- Login Page ---
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    const errorMsg = document.getElementById('errorMsg');

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorMsg.textContent = '';
      const password = document.getElementById('password').value;

      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        });
        const data = await res.json();
        if (data.success) {
          window.location.href = '/admin/dashboard.html';
        } else {
          errorMsg.textContent = data.error || 'Invalid password';
        }
      } catch {
        errorMsg.textContent = 'Connection error. Please try again.';
      }
    });

    return;
  }

  // --- Dashboard Page ---
  const inventoryBody = document.getElementById('inventoryBody');
  const categoriesBody = document.getElementById('categoriesBody');
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modalTitle');
  const itemForm = document.getElementById('itemForm');
  const addItemBtn = document.getElementById('addItemBtn');
  const modalClose = document.getElementById('modalClose');
  const modalCancel = document.getElementById('modalCancel');
  const logoutBtn = document.getElementById('logoutBtn');

  // Category modal elements
  const categoryModal = document.getElementById('categoryModal');
  const categoryModalTitle = document.getElementById('categoryModalTitle');
  const categoryForm = document.getElementById('categoryForm');
  const addCategoryBtn = document.getElementById('addCategoryBtn');
  const categoryModalClose = document.getElementById('categoryModalClose');
  const categoryModalCancel = document.getElementById('categoryModalCancel');
  const categoryNameInput = document.getElementById('categoryName');
  const categorySlugInput = document.getElementById('categorySlug');

  if (!inventoryBody) return;

  let categories = [];

  checkAuth();

  // ========== AUTH ==========

  async function checkAuth() {
    try {
      const res = await fetch('/api/admin/session');
      const data = await res.json();
      if (!data.authenticated) {
        window.location.href = '/admin/login.html';
        return;
      }
      await loadCategories();
      loadItems();
    } catch {
      window.location.href = '/admin/login.html';
    }
  }

  // ========== CATEGORIES ==========

  async function loadCategories() {
    try {
      const res = await fetch('/api/categories');
      categories = await res.json();
      renderCategoriesTable();
      populateCategorySelect();
    } catch {
      categoriesBody.innerHTML = '<tr><td colspan="4" class="empty-row">Failed to load categories.</td></tr>';
    }
  }

  function getCategoryLabel(slug) {
    const cat = categories.find(c => c.slug === slug);
    return cat ? cat.name : slug;
  }

  function populateCategorySelect() {
    const select = document.getElementById('itemCategory');
    select.innerHTML = categories.map(c =>
      `<option value="${escapeAttr(c.slug)}">${escapeHtml(c.name)}</option>`
    ).join('');
  }

  function renderCategoriesTable() {
    if (categories.length === 0) {
      categoriesBody.innerHTML = '<tr><td colspan="4" class="empty-row">No categories yet.</td></tr>';
      return;
    }

    categoriesBody.innerHTML = categories.map(cat => `
      <tr>
        <td class="table-name">${escapeHtml(cat.name)}</td>
        <td><code style="font-size:0.85rem;color:var(--color-tan);">${escapeHtml(cat.slug)}</code></td>
        <td class="cat-item-count" data-slug="${escapeAttr(cat.slug)}">—</td>
        <td>
          <div class="action-btns">
            <button class="btn-edit" data-cat-id="${cat.id}">Edit</button>
            <button class="btn-delete" data-cat-id="${cat.id}">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');

    categoriesBody.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => editCategory(parseInt(btn.dataset.catId)));
    });
    categoriesBody.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => deleteCategoryAction(parseInt(btn.dataset.catId)));
    });

    loadCategoryCounts();
  }

  async function loadCategoryCounts() {
    try {
      const res = await fetch('/api/inventory');
      const items = await res.json();
      const counts = {};
      items.forEach(item => {
        counts[item.category] = (counts[item.category] || 0) + 1;
      });
      document.querySelectorAll('.cat-item-count').forEach(td => {
        const slug = td.dataset.slug;
        td.textContent = counts[slug] || 0;
      });
    } catch { /* ignore */ }
  }

  // Category modal
  function openCategoryModal(cat) {
    if (cat) {
      categoryModalTitle.textContent = 'Edit Category';
      document.getElementById('categoryId').value = cat.id;
      categoryNameInput.value = cat.name;
      categorySlugInput.value = cat.slug;
    } else {
      categoryModalTitle.textContent = 'Add Category';
      categoryForm.reset();
      document.getElementById('categoryId').value = '';
    }
    categoryModal.classList.add('active');
    categoryNameInput.focus();
  }

  function closeCategoryModal() {
    categoryModal.classList.remove('active');
  }

  addCategoryBtn.addEventListener('click', () => openCategoryModal(null));
  categoryModalClose.addEventListener('click', closeCategoryModal);
  categoryModalCancel.addEventListener('click', closeCategoryModal);
  categoryModal.addEventListener('click', (e) => {
    if (e.target === categoryModal) closeCategoryModal();
  });

  // Auto-generate slug from name (only when creating)
  categoryNameInput.addEventListener('input', () => {
    if (!document.getElementById('categoryId').value) {
      categorySlugInput.value = categoryNameInput.value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }
  });

  categoryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('categoryId').value;
    const name = categoryNameInput.value.trim();
    const slug = categorySlugInput.value.trim();

    if (!name || !slug) return;

    try {
      const url = id ? `/api/categories/${id}` : '/api/categories';
      const method = id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug })
      });
      const data = await res.json();
      if (res.ok) {
        closeCategoryModal();
        await loadCategories();
        loadItems();
      } else {
        alert(data.error || 'Failed to save category');
      }
    } catch {
      alert('Connection error. Please try again.');
    }
  });

  function editCategory(id) {
    const cat = categories.find(c => c.id === id);
    if (cat) openCategoryModal(cat);
  }

  async function deleteCategoryAction(id) {
    const cat = categories.find(c => c.id === id);
    if (!cat) return;
    if (!confirm(`Delete the "${cat.name}" category?`)) return;

    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' }
      });
      const data = await res.json();
      if (res.ok) {
        await loadCategories();
      } else {
        alert(data.error || 'Failed to delete category');
      }
    } catch {
      alert('Connection error');
    }
  }

  // ========== INVENTORY ==========

  async function loadItems() {
    try {
      const res = await fetch('/api/inventory');
      const items = await res.json();
      renderTable(items);
    } catch {
      inventoryBody.innerHTML = '<tr><td colspan="6" class="empty-row">Failed to load inventory.</td></tr>';
    }
  }

  function renderTable(items) {
    if (items.length === 0) {
      inventoryBody.innerHTML = '<tr><td colspan="6" class="empty-row">No inventory items yet. Click "+ Add Item" to get started.</td></tr>';
      return;
    }

    inventoryBody.innerHTML = items.map(item => `
      <tr data-id="${item.id}">
        <td>
          ${item.image_url
            ? `<img src="${escapeAttr(item.image_url)}" alt="${escapeAttr(item.name)}" class="table-thumb">`
            : '<span class="table-thumb" style="display:inline-block;background:var(--color-sand);"></span>'
          }
        </td>
        <td class="table-name">${escapeHtml(item.name)}</td>
        <td><span class="table-category">${escapeHtml(getCategoryLabel(item.category))}</span></td>
        <td class="table-price">$${Number(item.price).toFixed(2)}</td>
        <td>
          <label class="stock-toggle">
            <input type="checkbox" ${item.in_stock ? 'checked' : ''} data-id="${item.id}" class="stock-checkbox">
            <span class="toggle-slider"></span>
          </label>
        </td>
        <td>
          <div class="action-btns">
            <button class="btn-edit" data-id="${item.id}">Edit</button>
            <button class="btn-delete" data-id="${item.id}">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');

    inventoryBody.querySelectorAll('.stock-checkbox').forEach(cb => {
      cb.addEventListener('change', () => toggleStock(cb.dataset.id));
    });
    inventoryBody.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => editItem(btn.dataset.id));
    });
    inventoryBody.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => deleteItem(btn.dataset.id));
    });
  }

  // Item modal
  function openModal(item) {
    if (item) {
      modalTitle.textContent = 'Edit Item';
      document.getElementById('itemId').value = item.id;
      document.getElementById('itemName').value = item.name;
      document.getElementById('itemDescription').value = item.description;
      document.getElementById('itemCategory').value = item.category;
      document.getElementById('itemPrice').value = item.price;
      document.getElementById('itemImageUrl').value = item.image_url && !item.image_url.startsWith('/uploads/') ? item.image_url : '';
      document.getElementById('itemInStock').checked = !!item.in_stock;
      document.getElementById('itemImage').value = '';
    } else {
      modalTitle.textContent = 'Add Item';
      itemForm.reset();
      document.getElementById('itemId').value = '';
      document.getElementById('itemInStock').checked = true;
    }
    modal.classList.add('active');
  }

  function closeModal() {
    modal.classList.remove('active');
  }

  addItemBtn.addEventListener('click', () => openModal(null));
  modalClose.addEventListener('click', closeModal);
  modalCancel.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  itemForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('itemId').value;
    const fileInput = document.getElementById('itemImage');
    const hasFile = fileInput.files && fileInput.files.length > 0;

    const formData = new FormData();
    formData.append('name', document.getElementById('itemName').value);
    formData.append('description', document.getElementById('itemDescription').value);
    formData.append('category', document.getElementById('itemCategory').value);
    formData.append('price', document.getElementById('itemPrice').value || '0');
    formData.append('in_stock', document.getElementById('itemInStock').checked ? '1' : '0');

    if (hasFile) {
      formData.append('image', fileInput.files[0]);
    } else {
      formData.append('image_url', document.getElementById('itemImageUrl').value);
    }

    try {
      const url = id ? `/api/inventory/${id}` : '/api/inventory';
      const method = id ? 'PUT' : 'POST';
      const res = await fetch(url, { method, body: formData });
      if (res.ok) {
        closeModal();
        loadItems();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save item');
      }
    } catch {
      alert('Connection error. Please try again.');
    }
  });

  async function editItem(id) {
    try {
      const res = await fetch(`/api/inventory/${id}`);
      const item = await res.json();
      openModal(item);
    } catch {
      alert('Failed to load item');
    }
  }

  async function deleteItem(id) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      const res = await fetch(`/api/inventory/${id}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        loadItems();
      } else {
        alert('Failed to delete item');
      }
    } catch {
      alert('Connection error');
    }
  }

  async function toggleStock(id) {
    try {
      await fetch(`/api/inventory/${id}/stock`, {
        method: 'PATCH',
        headers: { 'Accept': 'application/json' }
      });
    } catch {
      loadItems();
    }
  }

  // ========== LOGOUT ==========

  logoutBtn.addEventListener('click', async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.href = '/admin/login.html';
  });

  // ========== UTILITIES ==========

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return (str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

});
