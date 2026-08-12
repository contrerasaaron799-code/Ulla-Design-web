const grid = document.getElementById('productGrid');
let productsData = [];
// ... resto del código de carga y mapas ...

function renderCatalog(items) {
    grid.innerHTML = ''; 
    items.forEach((item, index) => {
        const itemName = item.nombre || item.name || 'Producto sin nombre';
        let itemImage = ''; /* ... tu lógica de imagen ... */
        let itemCategory = item.categoria || item.category || 'todos';
        if (item.oferta === true) itemCategory = 'oferta';
        
        const itemUso = item.uso || 'Uso no especificado';
        const itemMaterial = item.material || item.elementos || item.description || 'Material no especificado';
        const itemBase = item.base || 'Base no especificada';
        const itemMedidas = item.medidas || 'Medidas no especificadas';
        const itemDetalleImg = item.imagen_detalle || '';
        const itemColores = item.colores || [];

        const itemId = item.id ? `prod-${item.id}` : `prod-${itemName.replace(/\s+/g, '-').toLowerCase()}`;

        const card = document.createElement('div');
        card.className = 'focus-card';
        card.id = itemId;
        card.setAttribute('data-category', itemCategory);
        card.setAttribute('data-date', item.fecha_agregado || item.date || '0');
        
        if (itemDetalleImg) card.setAttribute('data-detalle', itemDetalleImg);

        let colorHtml = '';
        if (itemColores.length > 0) {
            colorHtml = `<div class="color-swatches">`;
            itemColores.forEach(c => {
                colorHtml += `<span class="color-dot" style="background-color: ${c.hex};" title="${c.nombre}"></span>`;
            });
            colorHtml += `</div>`;
        }

        // HTML LIMPIO: Solo la imagen visible. Todo el texto está dentro de card-hidden-content
        card.innerHTML = `
            <img src="${itemImage}" alt="${itemName}">
            <div class="card-overlay">
                <div class="card-hidden-content">
                    <h3>${itemName}</h3>
                    <p class="info-line">Uso: ${itemUso}</p>
                    <p class="info-line">Material: ${itemMaterial}</p>
                    <p class="info-line">Base: ${itemBase}</p>
                    <p class="info-line">Medidas: ${itemMedidas}</p>
                    ${colorHtml}
                    <button class="btn-add-cart" onclick="addToCart('${itemName.replace(/'/g, "\\'")}', '${itemImage}', '${itemCategory}')">Agregar al carrito</button>
                </div>
            </div>
        `;
        grid.appendChild(card);

        /* --- EVENTOS 3D --- */
        card.addEventListener('mousemove', (e) => { /* ... tu código de rotación ... */ });
        card.addEventListener('mouseleave', () => { /* ... tu código de salida ... */ });

        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-add-cart')) return;
            const detalleUrl = card.getAttribute('data-detalle');
            if (detalleUrl) {
                openDetailModal(detalleUrl);
                return;
            }
            const isActive = card.classList.contains('active');
            card.style.transition = '';
            card.style.transform = '';
            card.style.boxShadow = '';
            document.querySelectorAll('.focus-card').forEach(c => c.classList.remove('active'));
            grid.classList.remove('has-active');

            if (!isActive) {
                card.classList.add('active');
                grid.classList.add('has-active');
            }
        });
    });
    applyFilters();
}
// ... resto del código del carrito y filtros ...