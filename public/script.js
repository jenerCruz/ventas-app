let ventas = [];
let sucursales = [];
let vendedores = [];
let metas = [];
let avanceChart = null; // referencia global al gráfico

// Cargar datos iniciales
async function cargarDatos() {
  try {
    [ventas, sucursales, vendedores, metas] = await Promise.all([
      axios.get('/api/ventas').then(res => res.data),
      axios.get('/api/sucursales').then(res => res.data),
      axios.get('/api/vendedores').then(res => res.data),
      axios.get('/api/metas').then(res => res.data)
    ]);
    cargarDropdowns();
    actualizarDashboard();
  } catch (error) {
    console.error("Error al cargar datos:", error);
  }
}

// Cargar dropdowns
function cargarDropdowns() {
  const sucursalSelect = document.getElementById('sucursal_id');
  const vendedorSelect = document.getElementById('vendedor_id');
  const filtroSucursalSelect = document.getElementById('filtroSucursal');
  const metaSucursalSelect = document.getElementById('metaSucursal');

  // Limpieza inicial
  sucursalSelect.innerHTML = '<option value="">Seleccionar Sucursal</option>';
  filtroSucursalSelect.innerHTML = '<option value="todos">Todas las Sucursales</option>';
  metaSucursalSelect.innerHTML = '<option value="">Seleccionar Sucursal</option>';

  // Poblar sucursales en los tres selects
  sucursales.forEach(sucursal => {
    sucursalSelect.add(new Option(sucursal.nombre, sucursal.id));
    filtroSucursalSelect.add(new Option(sucursal.nombre, sucursal.id));
    metaSucursalSelect.add(new Option(sucursal.nombre, sucursal.id));
  });

  // Poblar vendedores
  vendedorSelect.innerHTML = '<option value="">Seleccionar Vendedor</option>';
  vendedores.forEach(vendedor => {
    vendedorSelect.add(new Option(vendedor.nombre, vendedor.id));
  });
}

// Actualizar dashboard
function actualizarDashboard(filtros = {}) {
  let ventasFiltradas = [...ventas];
  if (filtros.sucursal && filtros.sucursal !== 'todos') {
    ventasFiltradas = ventasFiltradas.filter(v => Number(v.sucursal_id) === Number(filtros.sucursal));
  }
  if (filtros.fecha) {
    ventasFiltradas = ventasFiltradas.filter(v => v.fecha === filtros.fecha);
  }

  // Calcular totales
  const totalPiezas = ventasFiltradas.reduce((sum, venta) => sum + Number(venta.piezas), 0);
  const metaTotal = metas.reduce((sum, meta) => sum + Number(meta.meta), 0);
  const avance = metaTotal > 0 ? Math.min((totalPiezas / metaTotal) * 100, 100) : 0;

  document.getElementById('totalPiezas').textContent = totalPiezas;
  document.getElementById('metaTotal').textContent = metaTotal;
  document.getElementById('avance').textContent = `${avance.toFixed(1)}%`;

  // Gráfico de avance
  actualizarGraficoAvance(ventasFiltradas);
}

// Gráfico de avance por sucursal
function actualizarGraficoAvance(ventasFiltradas) {
  const ctx = document.getElementById('avancePorSucursal').getContext('2d');
  const datos = sucursales.map(sucursal => {
    const ventasSucursal = ventasFiltradas.filter(v => Number(v.sucursal_id) === Number(sucursal.id));
    const piezasVendidas = ventasSucursal.reduce((sum, v) => sum + Number(v.piezas), 0);
    const metaSucursal = metas.find(m => Number(m.sucursal_id) === Number(sucursal.id))?.meta || 0;
    const avance = metaSucursal > 0 ? (piezasVendidas / metaSucursal) * 100 : 0;
    return { nombre: sucursal.nombre, piezasVendidas, meta: Number(metaSucursal), avance };
  });

  if (avanceChart) {
    avanceChart.destroy();
  }

  avanceChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: datos.map(d => d.nombre),
      datasets: [
        { label: 'Piezas Vendidas', data: datos.map(d => d.piezasVendidas), backgroundColor: '#3b82f6' },
        { label: 'Meta', data: datos.map(d => d.meta), backgroundColor: '#ef4444' }
      ]
    },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  });
}

// Registrar venta
document.getElementById('ventaForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const venta = {
    vendedor_id: Number(document.getElementById('vendedor_id').value),
    sucursal_id: Number(document.getElementById('sucursal_id').value),
    piezas: Number(document.getElementById('piezas').value),
    fecha: new Date().toISOString().split('T')[0]
  };
  try {
    await axios.post('/api/ventas', venta);
    alert('Venta registrada con éxito');
    await cargarDatos();
  } catch (error) {
    console.error('Error al registrar venta:', error);
    alert('Error al registrar venta');
  }
});

// Establecer meta
document.getElementById('btnEstablecerMeta').addEventListener('click', async () => {
  const sucursalId = Number(document.getElementById('metaSucursal').value);
  const piezasMeta = Number(document.getElementById('metaPiezas').value);
  if (!sucursalId || !piezasMeta) return alert('Selecciona sucursal e ingresa piezas');
  try {
    await axios.post('/api/metas', { sucursal_id: sucursalId, meta: piezasMeta });
    alert('Meta establecida con éxito');
    await cargarDatos();
  } catch (error) {
    console.error('Error al establecer meta:', error);
    alert('Error al establecer meta');
  }
});

// Filtrar datos
document.getElementById('btnFiltrar').addEventListener('click', () => {
  const filtros = {
    sucursal: document.getElementById('filtroSucursal').value,
    fecha: document.getElementById('filtroFecha').value
  };
  actualizarDashboard(filtros);
});

// Cargar datos al inicio
document.addEventListener('DOMContentLoaded', cargarDatos);
