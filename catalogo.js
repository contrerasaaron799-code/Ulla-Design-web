document.addEventListener('DOMContentLoaded', function () {
  const grid = document.getElementById('productGrid');
  let productsData = [];

  /* =========================================================
     MAPA DE SUBCATEGORÍAS
     Usa exactamente los nombres del código original.
     ========================================================= */
  const subcategoryMap = {
    hogar: [
      'todos',
      'sillas',
      'sofas',
      'taburetes',
      'paneles',
      'salones',
      'juvenil',
      'mesasdecomedor',
      'mesasdecentro'
    ],

    hotel: [
      'todos',
      'bancos de hosteleria',
      'sillas',
      'sofas',
      'taburetes',
      'mesasdecomedor',
      'mesasdecentro',
      'paneles',
      'salones',
      'exteriores',
      'basesmetalicas',
      'lamparas y decoracion'
    ],

    contract: [
      'todos',
      'bancos de hosteleria',
      'sofas',
      'sillas',
      'taburetes',
      'mesasdecomedor',
      'mesasdecentro',
      'paneles',
      'salones',
      'exteriores',
      'basesmetalicas'
    ]
  };

  /* =========================================================
     ORDEN VISUAL DEL CATÁLOGO
     ========================================================= */
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

  /* =========================================================
     FUNCIÓN SIMPLE:
     Convierte la categoría del JSON en un arreglo.

     Ejemplos:
     "sillas"              -> ["sillas"]
     "sillas,hotel"        -> ["sillas", "hotel"]
     ["sillas", "hotel"]   -> ["sillas", "hotel"]

     Si oferta es true:
     ["sillas"] + oferta   -> ["sillas", "oferta"]
     ========================================================= */
  function getProductCategories(item) {
    let categories = item.categoria || item.category || 'todos';

    if (!Array.isArray(categories)) {
      categories = String(categories)
        .split(',')
        .map(category => category.trim().toLowerCase())
        .filter(Boolean);
    } else {
      categories = categories
        .map(category => String(category).trim().toLowerCase())
        .filter(Boolean);
    }

    if (item.oferta === true && !categories.includes('oferta')) {
      categories.push('oferta');
    }

    return [...new Set(categories)];
  }

  /* =========================================================
     CARGAR ARCHIVOS DE PRODUCTOS
     ========================================================= */
  async function loadProducts() {
    try {
      const response = await fetch('productos.json');

      if (!response.ok) {
        throw new Error('No se pudo cargar el índice productos.json');
      }

      const jsonFiles = await response.json();

      if (!Array.isArray(jsonFiles)) {
        throw new Error('El archivo productos.json no tiene el formato correcto');
      }

      const results = [];

      for (const path of jsonFiles) {
        try {
          const res = await fetch(path);

          if (!res.ok) {
            throw new Error(`Error al cargar ${path}`);
          }

          const data = await res.json();

          if (Array.isArray(data)) {
            results.push(data);
          } else {
            console.warn(`⚠️ ${path} no contiene una lista de productos.`);
          }
        } catch (error) {
          console.warn(`⚠️ No se pudo cargar ${path}.`, error);
        }
      }

      productsData = results.flat();

      if (productsData.length === 0) {
        grid.innerHTML = `
          <div style="text-align:center;padding:40px;color:var(--muted);font-style:italic;">
            El catálogo está vacío o no se encontraron datos.
          </div>
        `;
        return;
      }

      /* Mostrar Liquidación solo si existen productos en oferta */
      const hayOfertas = productsData.some(item => item.oferta === true);

      const botonOferta = document.querySelector(
        '#categoryFilters .dropdown-item[data-category="oferta"]'
      );

      if (botonOferta) {
        botonOferta.style.display = hayOfertas ? 'block' : 'none';
      }

      renderCatalog(productsData);
      checkUrlParams();
    } catch (error) {
      console.error('Error crítico cargando productos:', error);

      grid.innerHTML = `
        <div style="
          text-align:center;
          padding:40px;
          color:#C62828;
          font-weight:bold;
          border:1px solid #C62828;
          border-radius:12px;
          background:#fff;
        ">
          <h3>Error al cargar el catálogo</h3>
          <p style="font-size:14px;color:#555;">${error.message}</p>
          <p style="font-size:12px;color:#888;">
            Revisa la consola del navegador con F12 para más detalles.
          </p>
        </div>
      `;

      productsData = [];
    }
  }

  /* =========================================================
     CREAR TARJETAS DE PRODUCTOS
     ========================================================= */
  function renderCatalog(items) {
    grid.innerHTML = '';

    if (!items || items.length === 0) {
      return;
    }

    items.forEach(item => {
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
        itemImage = 'https://via.placeholder.com/300?text=Sin+imagen';
      }

      /*
        Aquí ocurre la corrección:
        El producto conserva su categoría original.
        Si está en oferta, también recibe la categoría "oferta".

        Ejemplo:
        categoria: "sillas"
        oferta: true

        Resultado:
        data-category="sillas,oferta"
      */
      const itemCategories = getProductCategories(item);
      const itemCategoryText = itemCategories.join(',');

      const itemDetalleImg = item.imagen_detalle || '';
      const itemColores = item.colores || [];

      const itemId = item.id
        ? `prod-${item.id}`
        : `prod-${itemName
            .replace(/\s+/g, '-')
            .replace(/[^\w-]/g, '')
            .toLowerCase()}`;

      const card = document.createElement('div');

      card.className = 'focus-card';
      card.id = itemId;

      card.setAttribute('data-category', itemCategoryText);
      card.setAttribute('data-date', item.fecha_agregado || item.date || '0');
      card.setAttribute('data-name', itemName);
      card.setAttribute('data-image', itemImage);
      card.setAttribute('data-uso', item.uso || '');
      card.setAttribute(
        'data-material',
        item.material || item.elementos || item.description || ''
      );
      card.setAttribute('data-base', item.base || '');
      card.setAttribute('data-medidas', item.medidas || '');
      card.setAttribute('data-colores', JSON.stringify(itemColores));

      if (itemDetalleImg) {
        card.setAttribute('data-detalle', itemDetalleImg);
      }

      card.innerHTML = `
        <img src="${itemImage}" alt="${itemName}" loading="lazy">
      `;

      grid.appendChild(card);

      /* Efecto 3D al pasar el mouse */
      card.addEventListener('mousemove', event => {
        if (card.classList.contains('active')) {
          return;
        }

        const rect = card.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;

        card.style.transition = 'none';
        card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        card.style.boxShadow = `${-rotateY}px ${rotateX}px 20px rgba(0,0,0,.15)`;
      });

      card.addEventListener('mouseleave', () => {
        if (!card.classList.contains('active')) {
          card.style.transition = '';
          card.style.transform = '';
          card.style.boxShadow = '';
        }
      });

      card.addEventListener('click', () => {
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

  /* =========================================================
     MODAL DE DETALLES
     ========================================================= */
  function openDetailModal(card) {
    const imgSrc = card.getAttribute('data-detalle');
    const name = card.getAttribute('data-name');
    const image = card.getAttribute('data-image');
    const category = card.getAttribute('data-category');

    document.getElementById('detailImage').src = imgSrc;
    document.getElementById('detailModal').classList.add('show');
    document.body.style.overflow = 'hidden';

    const btn = document.getElementById('detailModalAddCart');

    btn.onclick = function () {
      addToCart(name, image, category);
      closeDetailModal();
    };
  }

  function closeDetailModal() {
    document.getElementById('detailModal').classList.remove('show');
    document.body.style.overflow = '';
  }

  function handleDetailModalClick(event) {
    if (event.target.id === 'detailModal') {
      closeDetailModal();
    }
  }

  /* =========================================================
     MODAL DE PRODUCTO
     ========================================================= */
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
    document.getElementById('productModalMaterial').textContent = material
      ? `Material: ${material}`
      : '';
    document.getElementById('productModalBase').textContent = base ? `Base: ${base}` : '';
    document.getElementById('productModalMedidas').textContent = medidas
      ? `Medidas: ${medidas}`
      : '';

    const colorContainer = document.getElementById('productModalColores');

    colorContainer.innerHTML = '';

    if (colores) {
      try {
        const coloresArray = JSON.parse(colores);

        coloresArray.forEach(color => {
          const dot = document.createElement('span');

          dot.className = 'color-dot';
          dot.style.backgroundColor = color.hex || '#cccccc';
          dot.title = color.nombre || 'Color';

          colorContainer.appendChild(dot);
        });
      } catch (error) {
        colorContainer.innerHTML = '';
      }
    }

    const btn = document.getElementById('productModalBtn');

    btn.onclick = function () {
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

  function handleProductModalClick(event) {
    if (event.target.id === 'productModal') {
      closeProductModal();
    }
  }

  /* =========================================================
     LEER PARÁMETROS DE URL
     Ejemplo:
     categorias.html?categoria=sillas
     ========================================================= */
  function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);

    const targetId = urlParams.get('focus');

    if (targetId) {
      const targetCard = document.getElementById(targetId);

      if (targetCard) {
        targetCard.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });

        openProductModal(targetCard);
      }
    }

    const categoriaUrl = urlParams.get('categoria');

    if (categoriaUrl) {
      const botonFiltro = document.querySelector(
        `#categoryFilters .dropdown-item[data-category="${categoriaUrl}"]`
      );

      if (botonFiltro) {
        botonFiltro.click();
      }
    }
  }

  /* =========================================================
     CARRITO
     ========================================================= */
  let cartItems = JSON.parse(localStorage.getItem('ulla_cart')) || [];

  function addToCart(name, image, category) {
    const existingIndex = cartItems.findIndex(item => item.name === name);

    if (existingIndex > -1) {
      cartItems[existingIndex].quantity += 1;
    } else {
      cartItems.push({
        name,
        image,
        category,
        quantity: 1
      });
    }

    updateCartUI();

    const badge = document.getElementById('cartCount');

    if (badge) {
      badge.style.transform = 'scale(1.3)';

      setTimeout(() => {
        badge.style.transform = 'scale(1)';
      }, 200);
    }
  }

  function updateQuantity(index, change) {
    cartItems[index].quantity += change;

    if (cartItems[index].quantity <= 0) {
      cartItems.splice(index, 1);
    }

    updateCartUI();
  }

  function removeFromCart(index) {
    cartItems.splice(index, 1);
    updateCartUI();
  }

  function updateCartUI() {
    localStorage.setItem('ulla_cart', JSON.stringify(cartItems));

    const totalCount = cartItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    const badge = document.getElementById('cartCount');

    if (badge) {
      badge.textContent = totalCount;
    }

    const modalCount = document.getElementById('modalItemsCount');

    if (modalCount) {
      modalCount.textContent = `${totalCount} Item${totalCount !== 1 ? 's' : ''}`;
    }

    const listContainer = document.getElementById('cartItemsList');

    if (!listContainer) {
      return;
    }

    listContainer.innerHTML = '';

    if (cartItems.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-cart-message">
          Tu carrito está vacío. ¡Explora nuestro catálogo exclusivo!
        </div>
      `;
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
            <button class="remove-btn" onclick="removeFromCart(${index})">
              Remove
            </button>
          </div>
        </div>

        <div class="quantity-control">
          <button onclick="updateQuantity(${index}, -1)">-</button>
          <span>${item.quantity}</span>
          <button onclick="updateQuantity(${index}, 1)">+</button>
        </div>
      `;

      listContainer.appendChild(row);
    });
  }

  function openCartModal() {
    document.getElementById('cartModalOverlay').classList.add('show');
  }

  function closeCartModal() {
    document.getElementById('cartModalOverlay').classList.remove('show');
  }

  function handleModalClick(event) {
    if (event.target.id === 'cartModalOverlay') {
      closeCartModal();
    }
  }

  function checkout() {
    if (cartItems.length === 0) {
      alert('Tu carrito está vacío.');
      return;
    }

    closeCartModal();

    setTimeout(() => {
      sendCartToWhatsApp();
    }, 500);
  }

  function sendCartToWhatsApp() {
    const phoneNumber = '34622251256';

    let orderDetails =
      'Hola Ulla Design, me interesaría saber la disponibilidad y detalles de los siguientes productos:\n\n';

    cartItems.forEach(item => {
      orderDetails += `- ${item.quantity}x ${item.name}\n`;
    });

    orderDetails += '\nQuedo a la espera de su respuesta. Gracias.';

    window.open(
      `https://wa.me/${phoneNumber}?text=${encodeURIComponent(orderDetails)}`,
      '_blank'
    );

    cartItems = [];
    localStorage.removeItem('ulla_cart');
    updateCartUI();
  }

  /* =========================================================
     FILTROS Y BÚSQUEDA
     ========================================================= */
  const dropdownTrigger = document.getElementById('dropdownTrigger');
  const dropdownMenu = document.getElementById('dropdownMenu');

  const subcategoryContainer = document.getElementById(
    'subcategoryDropdownContainer'
  );

  const subcategoryTrigger = document.getElementById('subcategoryTrigger');
  const subcategoryMenu = document.getElementById('subcategoryMenu');
  const subcategoryFilters = document.getElementById('subcategoryFilters');

  const categoryBtns = document.querySelectorAll(
    '#categoryFilters .dropdown-item'
  );

  const searchInput = document.getElementById('searchInput');

  let currentCategory = 'todos';
  let currentSubcategory = 'todos';

  /* Botón principal Categorías */
  if (dropdownTrigger && dropdownMenu) {
    dropdownTrigger.addEventListener('click', function (event) {
      event.stopPropagation();

      dropdownMenu.classList.toggle('show');
      dropdownTrigger.classList.toggle('active');
    });
  }

  /* Botón Subcategoría */
  if (subcategoryTrigger && subcategoryMenu) {
    subcategoryTrigger.addEventListener('click', function (event) {
      event.stopPropagation();

      subcategoryMenu.classList.toggle('show');
      subcategoryTrigger.classList.toggle('active');
    });
  }

  /* Cerrar dropdowns al hacer clic fuera */
  document.addEventListener('click', function (event) {
    if (!event.target.closest('.custom-dropdown')) {
      document
        .querySelectorAll('.dropdown-menu.show')
        .forEach(element => element.classList.remove('show'));

      document
        .querySelectorAll('.dropdown-trigger.active')
        .forEach(element => element.classList.remove('active'));
    }

    if (!event.target.closest('.focus-card')) {
      document.querySelectorAll('.focus-card').forEach(card => {
        card.classList.remove('active');
      });

      if (grid) {
        grid.classList.remove('has-active');
      }
    }
  });

  /* Selección de categoría principal */
  categoryBtns.forEach(button => {
    button.addEventListener('click', event => {
      event.stopPropagation();

      categoryBtns.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      currentCategory = button.getAttribute('data-category');
      currentSubcategory = 'todos';

      updateSubcategoryMenu(currentCategory);
      applyFilters();
    });
  });

  /* Buscar productos */
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      applyFilters();
    });
  }

  /* =========================================================
     CREAR SUBCATEGORÍAS PARA HOGAR / HOTEL / CONTRACT
     ========================================================= */
  function updateSubcategoryMenu(category) {
    if (!subcategoryFilters || !subcategoryContainer) {
      return;
    }

    subcategoryFilters.innerHTML = '';

    const options = subcategoryMap[category];

    if (!options || options.length === 0) {
      subcategoryContainer.classList.remove('visible');
      currentSubcategory = 'todos';
      return;
    }

    subcategoryContainer.classList.add('visible');

    const readableNames = {
      todos: 'Todos',
      sillas: 'Sillas',
      sofas: 'Sillones y Sofás',
      taburetes: 'Taburetes',
      paneles: 'Paneles',
      salones: 'Salones',
      juvenil: 'Juvenil',
      mesasdecomedor: 'Mesas de comedor',
      mesasdecentro: 'Centros de Mesa',
      exteriores: 'Exterior',
      basesmetalicas: 'Bases metálicas y Tableros',
      'bancos de hosteleria': 'Bancos de Hostelería',
      'lamparas y decoracion': 'Lámparas y Decoración'
    };

    options.forEach(subcategory => {
      const button = document.createElement('button');

      button.className = 'dropdown-item';
      button.setAttribute('data-subcategory', subcategory);

      button.textContent =
        readableNames[subcategory] ||
        subcategory.charAt(0).toUpperCase() + subcategory.slice(1);

      button.addEventListener('click', event => {
        event.stopPropagation();

        subcategoryFilters
          .querySelectorAll('.dropdown-item')
          .forEach(btn => btn.classList.remove('active'));

        button.classList.add('active');

        currentSubcategory = button.getAttribute('data-subcategory');

        applyFilters();
      });

      subcategoryFilters.appendChild(button);
    });

    const firstButton = subcategoryFilters.querySelector('.dropdown-item');

    if (firstButton) {
      firstButton.classList.add('active');
    }
  }

  /* =========================================================
     DEFINIR QUÉ CATEGORÍAS SE MUESTRAN
     CUANDO ELIGES HOGAR / HOTEL / CONTRACT
     ========================================================= */
  function getTargetCategories(category) {
    if (category === 'hogar') {
      return subcategoryMap.hogar;
    }

    if (category === 'hotel') {
      return subcategoryMap.hotel;
    }

    if (category === 'contract') {
      return subcategoryMap.contract;
    }

    return [category];
  }

  /* =========================================================
     APLICAR CATEGORÍAS, SUBCATEGORÍAS Y BÚSQUEDA
     ========================================================= */
  function applyFilters() {
    if (!grid) {
      return;
    }

    const cardsArray = Array.from(
      grid.querySelectorAll('.focus-card')
    );

    const searchTerm = searchInput
      ? searchInput.value.toLowerCase().trim()
      : '';

    const targetCategories = getTargetCategories(currentCategory);

    /*
      Mantiene el modo visual "view-all" para categorías grandes.
    */
    if (['todos', 'hogar', 'hotel', 'contract'].includes(currentCategory)) {
      grid.classList.add('view-all');
    } else {
      grid.classList.remove('view-all');
    }

    cardsArray.forEach(card => {
      const cardCategories = (card.getAttribute('data-category') || '')
        .split(',')
        .map(category => category.trim().toLowerCase())
        .filter(Boolean);

      const cardName = (card.getAttribute('data-name') || '').toLowerCase();
      const cardMaterial = (card.getAttribute('data-material') || '').toLowerCase();
      const cardUso = (card.getAttribute('data-uso') || '').toLowerCase();

      const matchesSearch =
        !searchTerm ||
        cardName.includes(searchTerm) ||
        cardMaterial.includes(searchTerm) ||
        cardUso.includes(searchTerm) ||
        cardCategories.some(category => category.includes(searchTerm));

      const matchesCategory =
        currentCategory === 'todos' ||
        targetCategories.some(category => cardCategories.includes(category));

      const matchesSubcategory =
        currentSubcategory === 'todos' ||
        cardCategories.includes(currentSubcategory);

      if (matchesSearch && matchesCategory && matchesSubcategory) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
        card.classList.remove('active');
      }
    });

    reorderVisibleCards(cardsArray);
  }

  /* =========================================================
     ORDENAR TARJETAS VISIBLES POR CATEGORY_ORDER
     ========================================================= */
  function reorderVisibleCards(cardsArray) {
    const visibleCards = cardsArray.filter(
      card => card.style.display !== 'none'
    );

    const grouped = {};

    visibleCards.forEach(card => {
      const categories = (card.getAttribute('data-category') || '')
        .split(',')
        .map(category => category.trim().toLowerCase())
        .filter(Boolean);

      /*
        Se toma la primera categoría real de la lista.
        "oferta" no desplaza el producto de su grupo original.
      */
      let primaryCategory = categories.find(
        category => category !== 'oferta' && CATEGORY_ORDER.includes(category)
      );

      if (!primaryCategory) {
        primaryCategory = categories[0] || 'todos';
      }

      if (!grouped[primaryCategory]) {
        grouped[primaryCategory] = [];
      }

      grouped[primaryCategory].push(card);
    });

    CATEGORY_ORDER.forEach(category => {
      if (grouped[category]) {
        grouped[category].forEach(card => {
          grid.appendChild(card);
        });

        delete grouped[category];
      }
    });

    Object.keys(grouped).forEach(category => {
      grouped[category].forEach(card => {
        grid.appendChild(card);
      });
    });
  }

  /* =========================================================
     HACER FUNCIONES DISPONIBLES PARA EL HTML
     ========================================================= */
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

  window.applyFilters = applyFilters;

  updateCartUI();
  loadProducts();
});