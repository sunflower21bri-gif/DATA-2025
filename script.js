let peruMap = null;
let charts = {};

document.addEventListener('DOMContentLoaded', () => {
    populateLocationFilter();
    initCharts();
    initTables();
});

// Switch Tabs Functionality matching Professor's layout
function switchTab(tabId, event) {
    if (event) event.preventDefault();
    
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    
    // Show selected tab
    document.getElementById('tab-' + tabId).style.display = 'block';
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }

    // Update Header Title
    const titles = {
        'resumen': 'Resumen Ejecutivo - ENDES 2025',
        'unidades': 'Unidades Territoriales - ENDES 2025',
        'tablas': 'Resumen en Tablas - ENDES 2025',
        'estadisticas': 'Gráficos y Estadísticas - ENDES 2025',
        'mapa': 'Mapa Georreferenciado interactivo - ENDES 2025'
    };
    document.getElementById('page-title').textContent = titles[tabId] || 'Dashboard';

    // If map tab is selected, initialize Leaflet map (with multiple tile layers selector like professor's page)
    if (tabId === 'mapa' && !peruMap) {
        setTimeout(() => {
            peruMap = L.map('peru-map').setView([-9.19, -75.0152], 5);

            const baseLayers = {
                "OpenStreetMap (Estándar)": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }),
                "Topográfico (OpenTopoMap)": L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { maxZoom: 17 }),
                "Claro (Carto Voyager)": L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{@2x}.png', { maxZoom: 18 }),
                "Oscuro (Carto Dark)": L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{@2x}.png', { maxZoom: 18 })
            };

            baseLayers["Claro (Carto Voyager)"].addTo(peruMap);
            L.control.layers(baseLayers).addTo(peruMap);

            endesData.forEach(item => {
                const marker = L.circleMarker([item.lat, item.lng], {
                    radius: 8,
                    fillColor: "#3b82f6",
                    color: "#1e3a8a",
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8
                }).addTo(peruMap);

                marker.bindPopup(`
                    <div style="font-family: 'Inter', sans-serif; padding: 4px;">
                        <h4 style="color: #1e3a8a; margin-bottom: 4px; font-weight: 700;">${item.departamento}</h4>
                        <p style="font-size: 12px; margin: 2px 0;"><strong>Viviendas:</strong> ${item.viviendas.toLocaleString()}</p>
                        <p style="font-size: 12px; margin: 2px 0;"><strong>Población:</strong> ${item.poblacion.toLocaleString()}</p>
                        <p style="font-size: 12px; margin: 2px 0;"><strong>Altitud:</strong> ${item.altitud} msnm</p>
                    </div>
                `);
            });
        }, 200);
    } else if (tabId === 'mapa' && peruMap) {
        setTimeout(() => { peruMap.invalidateSize(); }, 200);
    }
}

function populateLocationFilter() {
    const select = document.getElementById('filter-ubicacion');
    endesData.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.departamento;
        opt.textContent = d.departamento;
        select.appendChild(opt);
    });

    select.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'todos') {
            document.getElementById('kpi-viviendas').textContent = "37,331";
            document.getElementById('kpi-poblacion').textContent = "131,929";
        } else {
            const found = endesData.find(item => item.departamento === val);
            if (found) {
                document.getElementById('kpi-viviendas').textContent = found.viviendas.toLocaleString();
                document.getElementById('kpi-poblacion').textContent = found.poblacion.toLocaleString();
            }
        }
    });
}

function resetFilters() {
    document.getElementById('filter-ubicacion').value = 'todos';
    document.getElementById('kpi-viviendas').textContent = "37,331";
    document.getElementById('kpi-poblacion').textContent = "131,929";
    document.getElementById('searchInput').value = '';
    renderTables(endesData);
}

function initTables() {
    renderTables(endesData);
    
    document.getElementById('searchInput').addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        const filtered = endesData.filter(item => item.departamento.toLowerCase().includes(q));
        renderTables(filtered);
    });
}

function renderTables(data) {
    const tableBody = document.getElementById('tableBody');
    const unidadesBody = document.getElementById('unidadesBody');
    
    tableBody.innerHTML = '';
    unidadesBody.innerHTML = '';

    data.forEach(row => {
        // Tablas
        const tr1 = document.createElement('tr');
        tr1.innerHTML = `
            <td><strong>${row.departamento}</strong></td>
            <td>${row.viviendas.toLocaleString()}</td>
            <td>${row.poblacion.toLocaleString()}</td>
            <td>${row.altitud.toLocaleString()} msnm</td>
            <td>${(row.poblacion / row.viviendas).toFixed(2)} hab/viv</td>
        `;
        tableBody.appendChild(tr1);

        // Unidades Territoriales
        const tr2 = document.createElement('tr');
        tr2.innerHTML = `
            <td><strong>${row.departamento}</strong></td>
            <td>${row.lat}</td>
            <td>${row.lng}</td>
            <td>${row.viviendas.toLocaleString()}</td>
            <td>${row.poblacion.toLocaleString()}</td>
            <td>${row.altitud} msnm</td>
        `;
        unidadesBody.appendChild(tr2);
    });
}

function initCharts() {
    const sortedByPop = [...endesData].sort((a, b) => b.poblacion - a.poblacion).slice(0, 10);
    
    // Resumen Ejecutivo Chart
    const ctx1 = document.getElementById('resumenChart').getContext('2d');
    charts.resumen = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: sortedByPop.map(d => d.departamento),
            datasets: [{
                data: sortedByPop.map(d => d.poblacion),
                backgroundColor: '#3b82f6',
                borderRadius: 6
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });

    // Viviendas Chart
    const ctx2 = document.getElementById('viviendasChart').getContext('2d');
    charts.viviendas = new Chart(ctx2, {
        type: 'line',
        data: {
            labels: endesData.map(d => d.departamento),
            datasets: [{
                label: 'Viviendas',
                data: endesData.map(d => d.viviendas),
                borderColor: '#1e3a8a',
                backgroundColor: 'rgba(30, 58, 138, 0.1)',
                fill: true,
                tension: 0.3
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // Altitud Chart
    const ctx3 = document.getElementById('altitudChart').getContext('2d');
    charts.altitud = new Chart(ctx3, {
        type: 'bar',
        data: {
            labels: endesData.map(d => d.departamento),
            datasets: [{
                label: 'Altitud (msnm)',
                data: endesData.map(d => d.altitud),
                backgroundColor: '#0ea5e9',
                borderRadius: 4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}
