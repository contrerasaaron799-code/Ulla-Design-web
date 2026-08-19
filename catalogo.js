document.addEventListener('DOMContentLoaded', function() {
  const grid = document.getElementById('productGrid');
  let productsData = [];

  // =========================================
  // ORDEN PERSONALIZADO DE CATEGORÍAS (TODO EN MINÚSCULAS)
  // Puedes cambiar el orden a tu gusto.
  // =========================================
  const CATEGORY_ORDER = [
      'sillas',
      'sofas',
      'taburetes',
      'mesasdecomedor',
      'mesasdecentro',
      'paneles',
      'salones',
      'juvenil',
      'exteriores',
      'basesmetalicas',
      'bancos de hosteleria',
      'lamparas y decoracion',
      'suelos vinilicos',
      'hogar',
      'hotel',
      'contract',
      'oferta',
      'todos'
  ];

  const subcategoryMap = {
      'hogar': ['todos', 'sillas', 'sofas', 'taburetes', 'paneles', 'salones', 'juvenil', 'mesasdecomedor', 'mesasdecentro'],
      'hotel': ['todos', 'bancos de hosteleria', 'sillas', 'sofas', 'taburetes', 'mesasdecomedor', 'mesasdecentro', 'paneles', 'salones', 'exteriores', 'basesmetalicas', 'lamparas y decoracion'],
      'contract': ['todos', 'bancos de hosteleria', 'sofas', 'sillas', 'taburetes', 'mesasdecomedor', 'mesasdecentro', 'paneles', 'salones', 'exteriores', 'basesmetalicas']
  };

  async function loadProducts() {
    try {
      const response = await fetch('productos.json');
      if (!response.ok) throw new Error('No se pudo cargar el índice productos.json');
      const jsonFiles = await response.json();
      
      if (!Array.isArray(jsonFiles)) {
          throw new Error('El archivo productos.json no tiene el formato correcto');
      }

      const results = [];
      for (const path of jsonFiles) {
          try {
              const res = await fetch(path);
              if (!res.ok) throw new Error(`Error al cargar ${path}`);
              const data = await res.json();
              results.push(data);
          } catch (e) {
              console.warn(`⚠️ No se pudo cargar ${path}.`);
          }
      }
      productsData = results.flat();

      if(productsData.length === 0) {
          grid.innerHTML = `<div style="text-align:center;padding:40px;color:var(--muted);font-style:italic;">El catálogo está vacío o no se encontraron datos.</div>`;
      }

      const hayOfertas = productsData.some(item => item.oferta === true);
      const botonOferta = document.querySelector('#categoryFilters .dropdown-item[data-category="oferta"]');
      
      if (botonOferta) {
          if (!hayOfertas) {
              botonOferta.style.display = 'none';
          } else {
              botonOferta.style.display = 'block';
          }
      }

      renderCatalog(productsData);
      checkUrlParams();

    } catch (err) {
      console.error('Error crítico cargando productos:', err);
      grid.innerHTML = `<div style="text-align:center;padding:40px;color:#C62828;font-weight:bold;border:1px solid #C62828;border-radius:12px;background:#fff;">
          <h3>Error al cargar el catálogo</h3>
          <p style="font-size:14px;color:#555;">${err.message}</p>
          <p style="font-size:12px;color:#888;">Revisa la consola del navegador (F12) para más detalles.</p>
      </div>`;
      productsData = [];
    }
  }

  function renderCatalog(items) {
      grid.innerHTML = ''; 
      if (!items || items.length === 0) return;

      items.forEach((item, index) => {
          const itemName = item.nombre || item.name || 'Producto sin nombre';
          let itemImage = '';
          if (item.imagenes && Array.isArray(item.imagenes) && item.imagenes.length > 0) {
              itemImage = item.imagenes[0];
          } else if (item.image) {
              itemImage = item.image;
          } else if (item.imagen) {
              itemImage = item.imagen;
          } else if (item.imagenes && typeof item.imagenes === 'string') {
              itemImage = item.imagenes;
          } else {
              itemImage = 'https://via.placeholder.com/300';
          }
          let itemCategory = item.categoria || item.category || 'todos';
          // Normalizamos: minúsculas y sin espacios
          itemCategory = itemCategory.toLowerCase().trim();
          if (item.oferta === true) itemCategory = 'oferta';
          
          const itemDetalleImg = item.imagen_detalle || '';
          const itemColores = item.colores || [];

          const itemId = item.id ? `prod-${item.id}` : `prod-${itemName.replace(/\s+/g, '-').toLowerCase()}`;

          const card = document.createElement('div');
          card.className = 'focus-card';
          card.id = itemId;
          card.setAttribute('data-category', itemCategory);
          card.setAttribute('data-date', item.fecha_agregado || item.date || '0');
          
          card.setAttribute('data-name', itemName);
          card.setAttribute('data-image', itemImage);
          card.setAttribute('data-uso', item.uso || '');
          card.setAttribute('data-material', item.material || item.elementos || item.description || '');
          card.setAttribute('data-base', item.base || '');
          card.setAttribute('data-medidas', item.medidas || '');
          card.setAttribute('data-colores', JSON.stringify(itemColores));
          
          if (itemDetalleImg) card.setAttribute('data-detalle', itemDetalleImg);

          card.innerHTML = `
              <img src="${itemImage}" alt="${itemName}">
          `;
          grid.appendChild(card);

          card.addEventListener('mousemove', (e) => {
              if (card.classList.contains('active')) return;
              
              const rect = card.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              const centerX = rect.width / 2;
              const centerY = rect.height / 2;
              
              const rotateX = ((y - centerY) / centerY) * -10;
              const rotateY = ((x - centerX) / centerX) * 10;
              
              card.style.transition = 'none'; 
              card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
              card.style.boxShadow = `${-rotateY}px ${rotateX}px 20px rgba(0,0,0,0.15)`;
          });

          card.addEventListener('mouseleave', () => {
              if (!card.classList.contains('active')) {
                  card.style.transition = ''; 
                  card.style.transform = '';
                  card.style.boxShadow = '';
              }
          });

          card.addEventListener('click', (e) => {
              card.style.transition = '';
              card.style.transform = '';
              card.style.boxShadow = '';

              const detalleUrl = card.getAttribute('data-detalle');
              if (detalleUrl) {
                  openDetailModal(card);
                  return;
              }
              openProductModal(card);
          });
      });
      applyFilters();
  }

  function openDetailModal(card) {
      const imgSrc = card.getAttribute('data-detalle');
      const name = card.getAttribute('data-name');
      const image = card.getAttribute('data-image');
      const category = card.getAttribute('data-category');

      document.getElementById('detailImage').src = imgSrc;
      document.getElementById('detailModal').classList.add('show');
      document.body.style.overflow = 'hidden';

      const btn = document.getElementById('detailModalAddCart');
      btn.onclick = function() { 
          addToCart(name, image, category); 
          closeDetailModal(); 
      };
  }
  function closeDetailModal() {
      document.getElementById('detailModal').classList.remove('show');
      document.body.style.overflow = '';
  }
  function handleDetailModalClick(e) {
      if (e.target.id === 'detailModal') closeDetailModal();
  }

  function openProductModal(card) {
      const name = card.getAttribute('data-name');
      const image = card.getAttribute('data-image');
      const category = card.getAttribute('data-category');
      const uso = card.getAttribute('data-uso');
      const material = card.getAttribute('data-material');
      const base = card.getAttribute('data-base');
      const medidas = card.getAttribute('data-medidas');
      const colores = card.getAttribute('data-colores');

      document.getElementById('productModalImg').src = image;
      document.getElementById('productModalName').textContent = name;
      document.getElementById('productModalUso').textContent = uso ? `Uso: ${uso}` : '';
      document.getElementById('productModalMaterial').textContent = material ? `Material: ${material}` : '';
      document.getElementById('productModalBase').textContent = base ? `Base: ${base}` : '';
      document.getElementById('productModalMedidas').textContent = medidas ? `Medidas: ${medidas}` : '';

      const colorContainer = document.getElementById('productModalColores');
      colorContainer.innerHTML = '';
      if (colores) {
          try {
              const coloresArray = JSON.parse(colores);
              coloresArray.forEach(c => {
                  const dot = document.createElement('span');
                  dot.className = 'color-dot';
                  dot.style.backgroundColor = c.hex;
                  dot.title = c.nombre;
                  colorContainer.appendChild(dot);
              });
          } catch(e) { colorContainer.innerHTML = ''; }
      }

      const btn = document.getElementById('productModalBtn');
      btn.onclick = function() { 
          addToCart(name, image, category); 
          closeProductModal(); 
      };

      document.getElementById('productModal').classList.add('show');
      document.body.style.overflow = 'hidden';
  }
  function closeProductModal() {
      document.getElementById('productModal').classList.remove('show');
      document.body.style.overflow = '';
  }
  function handleProductModalClick(e) {
      if (e.target.id === 'productModal') closeProductModal();
  }

  function checkUrlParams() {
      const urlParams = new URLSearchParams(window.location.search);
      const targetId = urlParams.get('focus');
      if (targetId) {
          const targetCard = document.getElementById(targetId);
          if (targetCard) {
              targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
              openProductModal(targetCard);
          }
      }
      const categoriaUrl = urlParams.get('categoria');
      if (categoriaUrl) {
          const botonFiltro = document.querySelector(`#categoryFilters .dropdown-item[data-category="${categoriaUrl}"]`);
          if (botonFiltro) { botonFiltro.click(); }
      }
  }

  let cartItems = JSON.parse(localStorage.getItem('ulla_cart')) || [];
  updateCartUI();

  function addToCart(name, image, category) {
      const existingIndex = cartItems.findIndex(item => item.name === name);
      if (existingIndex > -1) { 
          cartItems[existingIndex].quantity += 1; 
      } else { 
          cartItems.push({ name, image, category, quantity: 1 }); 
      }
      updateCartUI();
      const badge = document.getElementById('cartCount');
      if (badge) {
          badge.style.transform = 'scale(1.3)';
          setTimeout(() => badge.style.transform = 'scale(1)', 200);
      }
  }

  function updateQuantity(index, change) { 
      cartItems[index].quantity += change; 
      if (cartItems[index].quantity <= 0) { cartItems.splice(index, 1); } 
      updateCartUI(); 
  }

  function removeFromCart(index) { 
      cartItems.splice(index, 1); 
      updateCartUI(); 
  }

  function updateCartUI() {
      localStorage.setItem('ulla_cart', JSON.stringify(cartItems));
      const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      const badge = document.getElementById('cartCount');
      if (badge) badge.textContent = totalCount;
      const modalCount = document.getElementById('modalItemsCount');
      if (modalCount) modalCount.textContent = `${totalCount} Item${totalCount !== 1 ? 's' : ''}`;
      
      const listContainer = document.getElementById('cartItemsList');
      if (!listContainer) return;
      listContainer.innerHTML = '';
      if (cartItems.length === 0) { 
          listContainer.innerHTML = '<div class="empty-cart-message">Tu carrito está vacío. ¡Explora nuestro catálogo exclusivo!</div>'; 
          return; 
      }
      cartItems.forEach((item, index) => {
          const row = document.createElement('div');
          row.className = 'cart-item-row';
          row.innerHTML = `
              <div class="cart-item-info">
                  <img src="${item.image}" alt="${item.name}">
                  <div class="cart-item-details">
                      <h4>${item.name}</h4>
                      <span>${item.category}</span>
                      <button class="remove-btn" onclick="removeFromCart(${index})">Remove</button>
                  </div>
              </div>
              <div class="quantity-control">
                  <button onclick="updateQuantity(${index}, -1)">-</button>
                  <span>${item.quantity}</span>
                  <button onclick="updateQuantity(${index}, 1)">+</button>
              </div>`;
          listContainer.appendChild(row);
      });
  }

  function openCartModal() { document.getElementById('cartModalOverlay').classList.add('show'); }
  function closeCartModal() { document.getElementById('cartModalOverlay').classList.remove('show'); }
  function handleModalClick(e) { if (e.target.id === 'cartModalOverlay') { closeCartModal(); } }

  function checkout() {
      if (cartItems.length === 0) { alert('Tu carrito está vacío.'); return; }
      closeCartModal();
      setTimeout(() => sendCartToWhatsApp(), 500);
  }

  function sendCartToWhatsApp() {
      const phoneNumber = "34622251256";
      let orderDetails = "Hola Ulla Design, me interesaría saber la disponibilidad y detalles de los siguientes productos:\n\n";
      cartItems.forEach(item => {
          orderDetails += `- ${item.quantity}x ${item.name}\n`;
      });
      orderDetails += `\nQuedo a la espera de su respuesta. Gracias.`;
      window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(orderDetails)}`, '_blank');
      cartItems = []; 
      localStorage.removeItem('ulla_cart'); 
      updateCartUI();
  }

  // ================= FILTROS Y BÚSQUEDA =================
  const dropdownTrigger = document.getElementById('dropdownTrigger');
  const dropdownMenu = document.getElementById('dropdownMenu');
  const dropdownContainer = document.getElementById('filterDropdownContainer');
  const subcategoryContainer = document.getElementById('subcategoryDropdownContainer');
  const subcategoryTrigger = document.getElementById('subcategoryTrigger');
  const subcategoryMenu = document.getElementById('subcategoryMenu');
  const subcategoryFilters = document.getElementById('subcategoryFilters');

  let currentCategory = 'todos';
  let currentSubcategory = 'todos';

  // EVENTO DEL BOTÓN CATEGORÍAS
  if (dropdownTrigger && dropdownMenu) {
      dropdownTrigger.addEventListener('click', function(e) {
          e.stopPropagation();
          dropdownMenu.classList.toggle('show');
          dropdownTrigger.classList.toggle('active');
      });
  }

  // EVENTO DEL BOTÓN SUBCATEGORÍAS
  if (subcategoryTrigger && subcategoryMenu) {
      subcategoryTrigger.addEventListener('click', function(e) {
          e.stopPropagation();
          subcategoryMenu.classList.toggle('show');
          subcategoryTrigger.classList.toggle('active');
      });
  }

  // CERRAR DROPDOWNS AL HACER CLIC FUERA
  document.addEventListener('click', function(e) {
      if (!e.target.closest('.custom-dropdown')) {
          document.querySelectorAll('.dropdown-menu.show').forEach(el => el.classList.remove('show'));
          document.querySelectorAll('.dropdown-trigger.active').forEach(el => el.classList.remove('active'));
      }
      if (!e.target.closest('.focus-card')) { 
          document.querySelectorAll('.focus-card').forEach(c => c.classList.remove('active')); 
          if (grid) grid.classList.remove('has-active'); 
      }
  });

  const categoryBtns = document.querySelectorAll('#categoryFilters .dropdown-item');
  const searchInput = document.getElementById('searchInput');

  categoryBtns.forEach(btn => { 
      btn.addEventListener('click', (e) => { 
          e.stopPropagation(); 
          categoryBtns.forEach(b => b.classList.remove('active')); 
          btn.classList.add('active'); 
          currentCategory = btn.getAttribute('data-category').toLowerCase().trim(); 
          updateSubcategoryMenu(currentCategory);
          currentSubcategory = 'todos';
          applyFilters(); 
      }); 
  });

  if (searchInput) {
      searchInput.addEventListener('input', () => { applyFilters(); });
  }

  function updateSubcategoryMenu(category) {
      if (!subcategoryFilters) return;
      subcategoryFilters.innerHTML = '';
      const options = subcategoryMap[category];
      if (options && options.length > 0) {
          subcategoryContainer.classList.add('visible');
          options.forEach(sub => {
              const btn = document.createElement('button');
              btn.className = 'dropdown-item';
              btn.setAttribute('data-subcategory', sub);
              const displayName = sub.charAt(0).toUpperCase() + sub.slice(1);
              btn.textContent = displayName;
              btn.addEventListener('click', (e) => {
                  e.stopPropagation();
                  subcategoryFilters.querySelectorAll('.dropdown-item').forEach(b => b.classList.remove('active'));
                  btn.classList.add('active');
                  currentSubcategory = sub;
                  applyFilters();
              });
              subcategoryFilters.appendChild(btn);
          });
          subcategoryFilters.firstChild?.classList.add('active');
      } else {
          subcategoryContainer.classList.remove('visible');
          currentSubcategory = 'todos';
      }
  }

  function applyFilters() {
      if (!grid) return;
      if (['todos', 'hogar', 'hotel', 'contract'].includes(currentCategory)) {
          grid.classList.add('view-all');
      } else {
          grid.classList.remove('view-all');
      }

      const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
      const cardsArray = Array.from(grid.querySelectorAll('.focus-card'));

      let targetCategories = [currentCategory];

      if (currentCategory === 'hogar') {
          targetCategories = ['hogar', 'sillas', 'sofas', 'taburetes', 'paneles', 'salones', 'juvenil', 'mesasdecomedor', 'mesasdecentro'];
      } else if (currentCategory === 'hotel') {
          targetCategories = ['hotel', 'bancos de hosteleria', 'sillas', 'sofas', 'taburetes', 'mesasdecomedor', 'mesasdecentro', 'paneles', 'salones', 'exteriores', 'basesmetalicas', 'lamparas y decoracion'];
      } else if (currentCategory === 'contract') {
          targetCategories = ['contract', 'bancos de hosteleria', 'sofas', 'sillas', 'taburetes', 'mesasdecomedor', 'mesasdecentro', 'paneles', 'salones', 'exteriores', 'basesmetalicas'];
      } else if (currentCategory === 'bancos de hosteleria') {
          targetCategories = ['bancos de hosteleria'];
      }

      cardsArray.forEach(card => {
          const catString = (card.getAttribute('data-category') || '').toLowerCase().trim();
          const catList = catString.split(',').map(c => c.trim());

          const matchesCategory = (currentCategory === 'todos' || targetCategories.some(cat => catList.includes(cat)));
          let matchesSubcategory = true;
          if (currentSubcategory !== 'todos') {
              matchesSubcategory = catList.includes(currentSubcategory);
          }

          if (matchesCategory && matchesSubcategory) { 
              card.style.display = 'block'; 
          } else { 
              card.style.display = 'none'; 
              card.classList.remove('active'); 
          }
      });

      // =========================================
      // AGRUPACIÓN POR CATEGORÍAS (SOLO CUANDO SUBCATEGORÍA ES 'todos')
      // =========================================
      if (currentSubcategory === 'todos') {
          const visibleCards = cardsArray.filter(card => card.style.display !== 'none');
          const grouped = {};

          // Agrupar por primera categoría (normalizada)
          visibleCards.forEach(card => {
              let cat = (card.getAttribute('data-category') || '').toLowerCase().trim();
              // Si tiene múltiples categorías, tomamos la primera
              if (cat.includes(',')) {
                  cat = cat.split(',')[0].trim();
              }
              if (!grouped[cat]) grouped[cat] = [];
              grouped[cat].push(card);
          });

          // Limpiar el grid para reordenar
          grid.innerHTML = '';

          // Recorrer el orden personalizado
          CATEGORY_ORDER.forEach(cat => {
              if (grouped[cat]) {
                  grouped[cat].forEach(card => grid.appendChild(card));
                  delete grouped[cat];
              }
          });

          // Agregar cualquier categoría restante
          Object.keys(grouped).forEach(cat => {
              grouped[cat].forEach(card => grid.appendChild(card));
          });

          return; // Salir para evitar otros reordenamientos
      }

      // --- ORDEN PERSONALIZADO PARA HOTEL (cuando no está en 'todos') ---
      if (currentCategory === 'hotel') {
          const visibleCards = cardsArray.filter(card => card.style.display !== 'none');
          visibleCards.sort((a, b) => {
              const catA = a.getAttribute('data-category');
              const catB = b.getAttribute('data-category');
              if (catA === 'sillas' && catB !== 'sillas') return -1;
              if (catB === 'sillas' && catA !== 'sillas') return 1;
              return 0;
          });
          visibleCards.forEach(card => grid.appendChild(card));
      }
  }

  loadProducts();

  window.addToCart = addToCart;
  window.updateQuantity = updateQuantity;
  window.removeFromCart = removeFromCart;
  window.openCartModal = openCartModal;
  window.closeCartModal = closeCartModal;
  window.handleModalClick = handleModalClick;
  window.checkout = checkout;
  window.openDetailModal = openDetailModal;
  window.closeDetailModal = closeDetailModal;
  window.handleDetailModalClick = handleDetailModalClick;
  window.openProductModal = openProductModal;
  window.closeProductModal = closeProductModal;
  window.handleProductModalClick = handleProductModalClick;
  window.toggleMenu = toggleMenu;
  window.applyFilters = applyFilters;
});