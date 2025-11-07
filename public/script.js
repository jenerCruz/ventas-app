// Variables globales
let ventas = [];
let sucursales = [];
let promotores = [];
let metas = { "Sucursal Centro": 10000, "Sucursal Norte": 8000 }; // Ejemplo de metas por sucursal

// Cargar datos iniciales
async function cargarDatos() {
  try {
    const [resVentas, resSucursales, resPromotores] = await Promise.all([
      axios.get('http://localhost:3000/api/ventas'),
      axios.get('http://localhost:3000/api/sucursales'),
      axios.get('http://localhost:3000/api/vendedores')
    ]);
    ventas = resVentas.data;
    sucursales = resSucursales.data;
    promotores = resPromotores.data;

    // Cargar dropdowns
    cargarDropdowns();
    // Actualizar tarjetas y gráficos
    actualizarDashboard();
  } catch (error) {
    console.error("Error al cargar datos:", error);
  }
}

// Cargar dropdowns de sucursales y promotores
function cargarDropdowns() {
  const sucursalSelect = document.getElementById('sucursal_id');
  const promotorSelect = document.getElementById('vendedor_id');
  const filtroSucursalSelect = document.getElementById('filtroSucursal');
  const filtroPromotorSelect = document.getElementById('filtroPromotor');

  sucursales.forEach(sucursal => {
    const option = document.createElement('option');
    option.value = sucursal.id;
    option.textContent = sucursal.nombre;
    sucursalSelect.appendChild(option.cloneNode(true));
    filtroSucursalSelect.appendChild(option);
  });

  promotores.forEach(promotor => {
    const option = document.createElement('option');
    option.value = promotor.id;
    option.textContent = promotor.nombre;
    promotorSelect.appendChild(option.cloneNode(true));
    filtroPromotorSelect.appendChild(option);
  });
}

// Actualizar tarjetas y gráficos
function actualizarDashboard(filtros = {}) {
  let ventasFiltradas = [...ventas];

  // Aplicar filtros
  if (filtros.sucursal && filtros.sucursal !== 'todos') {
    ventasFiltradas = ventasFiltradas.filter(v => v.sucursal_id == filtros.sucursal);
  }
  if (filtros.promotor && filtros.promotor !== 'todos') {
    ventasFiltradas = ventasFiltradas.filter(v => v.vendedor_id == filtros.promotor);
  }
  if (filtros.fecha) {
    ventasFiltradas = ventasFiltradas.filter(v => v.fecha === filtros.fecha);
  }

  // Actualizar tarjetas
  actualizarTarjetas(ventasFiltradas);

  // Actualizar gráficos
  actualizarGraficoVentasPorSucursal(ventasFiltradas);
  actualizarGraficoVentasDiarias(ventasFiltradas);
  actualizarGraficoPromedioPorPromotor(ventasFiltradas);
  actualizarGraficoAlcanceMetas(ventasFiltradas);
}

// Actualizar tarjetas de resumen
function actualizarTarjetas(ventasFiltradas) {
  const totalVentas = ventasFiltradas.reduce((sum, venta) => sum + venta.monto, 0);
  const metaMensual = Object.values(metas).reduce((sum, meta) => sum + meta, 0);
  const alcance = totalVentas > 0 ? Math.min((totalVentas / metaMensual) * 100, 100) : 0;
  const promedioDiario = ventasFiltradas.length > 0 ? totalVentas / new Set(ventasFiltradas.map(v => v.fecha)).size : 0;

  document.getElementById('totalVentas').textContent = `$${totalVentas.toFixed(2)}`;
  document.getElementById('metaMensual').textContent = `$${metaMensual.toFixed(2)}`;
  document.getElementById('alcance').textContent = `${alcance.toFixed(1)}%`;
  document.getElementById('promedioDiario').textContent = `$${promedioDiario.toFixed(2)}`;
}

// Gráfico: Ventas por Sucursal
function actualizarGraficoVentasPorSucursal(ventasFiltradas) {
  const ctx = document.getElementById('ventasPorSucursal').getContext('2d');
  const sucursalesNombres = sucursales.map(s => s.nombre);
  const datos = sucursalesNombres.map(nombre => {
    return ventasFiltradas
      .filter(v => sucursales.find(s => s.id === v.sucursal_id)?.nombre === nombre)
      .reduce((sum, venta) => sum + venta.monto, 0);
  });

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sucursalesNombres,
      datasets: [{
        label: 'Ventas por Sucursal',
        data: datos,
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } }
    }
  });
}

// Gráfico: Ventas Diarias
function actualizarGraficoVentasDiarias(ventasFiltradas) {
  const ctx = document.getElementById('ventasDiarias').getContext('2d');
  const ventasPorDia = {};
  ventasFiltradas.forEach(venta => {
    ventasPorDia[venta.fecha] = (ventasPorDia[venta.fecha] || 0) + venta.monto;
  });

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: Object.keys(ventasPorDia),
      datasets: [{
        label: 'Ventas Diarias',
        data: Object.values(ventasPorDia),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } }
    }
  });
}

// Gráfico: Promedio por Promotor
function actualizarGraficoPromedioPorPromotor(ventasFiltradas) {
  const ctx = document.getElementById('promedioPorPromotor').getContext('2d');
  const promotoresNombres = promotores.map(p => p.nombre);
  const datos = promotoresNombres.map(nombre => {
    const ventasPromotor = ventasFiltradas.filter(v => promotores.find(p => p.id === v.vendedor_id)?.nombre === nombre);
    return ventasPromotor.length > 0 ? (ventasPromotor.reduce((sum, v) => sum + v.monto, 0) / ventasPromotor.length) : 0;
  });

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: promotoresNombres,
      datasets: [{
        label: 'Promedio por Promotor',
        data: datos,
        backgroundColor: ['#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } }
    }
  });
}

// Gráfico: Alcance de Metas
function actualizarGraficoAlcanceMetas(ventasFiltradas) {
  const ctx = document.getElementById('alcanceMetas').getContext('2d');
  const datos = sucursales.map(sucursal => {
    const ventasSucursal = ventasFiltradas.filter(v => v.sucursal_id === sucursal.id);
    const totalSucursal = ventasSucursal.reduce((sum, v) => sum + v.monto, 0);
    const metaSucursal = metas[sucursal.nombre] || 0;
    const alcance = metaSucursal > 0 ? (totalSucursal / metaSucursal) * 100 : 0;
    return { nombre: sucursal.nombre, alcance, meta: metaSucursal, total: totalSucursal };
  });

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: datos.map(d => d.nombre),
      datasets: [{
        label: 'Alcance de Metas',
        data: datos.map(d => d.alcance),
        backgroundColor: datos.map(d => d.alcance >= 100 ? '#10b981' : '#f59e0b'),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              const data = datos[context.dataIndex];
              return [
                `Total: $${data.total.toFixed(2)}`,
                `Meta: $${data.meta.toFixed(2)}`,
                `Alcance: ${data.alcance.toFixed(1)}%`
              ];
            }
          }
        }
      }
    }
  });
}

// Registrar venta
document.getElementById('ventaForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const venta = {
    vendedor_id: parseInt(document.getElementById('vendedor_id').value),
    sucursal_id: parseInt(document.getElementById('sucursal_id').value),
    monto: parseFloat(document.getElementById('monto').value),
    fecha: new Date().toISOString().split('T')[0],
  };
  try {
    await axios.post('http://localhost:3000/api/ventas', venta);
    alert('Venta registrada con éxito');
    await cargarDatos(); // Recargar datos
  } catch (error) {
    alert('Error al registrar venta');
  }
});

// Filtrar datos
document.getElementById('btnFiltrar').addEventListener('click', () => {
  const filtros = {
    sucursal: document.getElementById('filtroSucursal').value,
    promotor: document.getElementById('filtroPromotor').value,
    fecha: document.getElementById('filtroFecha').value
  };
  actualizarDashboard(filtros);
});

// Cargar datos al inicio
cargarDatos();
