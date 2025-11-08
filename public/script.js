let ventas = [];
let sucursales = [];
let vendedores = [];
let metas = [];
let productos = ["Amigo Kit", "Chip Cero", "Portabilidad", "Chip Express"];
let meses = ["noviembre", "diciembre"];
let avanceChart = null;

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
  const filtroSucursalSelect = document.getElementById('filtroSucursal');
  const metaSucursalSelect = document.getElementById('metaSucursal');

  sucursalSelect.innerHTML = '<option value="">Seleccionar Sucursal</option>';
  filtroSucursalSelect.innerHTML = '<option value="todos">Todas las Sucursales</option>';
  metaSucursalSelect.innerHTML = '<option value="">Seleccionar Sucursal</option>';

  sucursales.forEach(sucursal => {
    sucursalSelect.add(new Option(sucursal.nombre, sucursal.id));
    filtroSucursalSelect.add(new Option(sucursal.nombre, sucursal.id));
    metaSucursalSelect.add(new Option(sucursal.nombre, sucursal.id));
  });

  const vendedorSelect = document.getElementById('vendedor_id');
  vendedorSelect.innerHTML = '<option value="">Seleccionar Vendedor</option>';
  vendedores.forEach(vendedor => {
    vendedorSelect.add(new Option(vendedor.nombre, vendedor.id));
  });

  const filtroProductoSelect = document.getElementById('filtroProducto');
  const metaProductoSelect = document.getElementById('metaProducto');
  const productoSelect = document.getElementById('producto');

  filtroProductoSelect.innerHTML = '<option value="todos">Todos los Productos</option>';
  metaProductoSelect.innerHTML = '<option value="">Seleccionar Producto</option>';
  productoSelect.innerHTML = '<option value="">Seleccionar Producto</option>';

  productos.forEach(producto => {
    filtroProductoSelect.add(new Option(producto, producto));
    metaProductoSelect.add(new Option(producto, producto));
    productoSelect.add(new Option(producto, producto));
  });

  const filtroMesSelect = document.getElementById('filtroMes');
  const metaMesSelect = document.getElementById('metaMes');

  filtroMesSelect.innerHTML = '<option value="todos">Todos los Meses</option>';
  metaMesSelect.innerHTML = '<option value="">Seleccionar Mes</option>';

  meses.forEach(mes => {
    filtroMesSelect.add(new Option(mes, mes));
    metaMesSelect.add(new Option(mes, mes));
  });
}

// Actualizar dashboard
function actualizarDashboard(filtros = {}) {
  let ventasFiltradas = [...ventas];

  if (filtros.sucursal && filtros.sucursal !== 'todos') {
    ventasFiltradas = ventasFiltradas.filter(v => Number(v.sucursal_id) === Number(filtros.sucursal));
  }

  if (filtros.producto && filtros.producto !== 'todos') {
    ventasFiltradas = ventasFiltradas.filter(v => v.producto === filtros.producto);
  }

  if (filtros.mes && filtros.mes !== 'todos') {
    const mesIndex = meses.indexOf(filtros.mes) + 1;
    const year = new Date().getFullYear();
    const fechaInicio = new Date(year, mesIndex - 1, 1).toISOString().split('T')[0];
    const fechaFin = new Date(year, mesIndex, 0).toISOString().split('T')[0];
    ventasFiltradas = ventasFiltradas.filter(v => v.fecha >= fechaInicio && v.fecha <= fechaFin);
  }

  if (filtros.fecha) {
    ventasFiltradas = ventasFiltradas.filter(v => v.fecha === filtros.fecha);
  }

  const totalesPorProducto = {};
  productos.forEach(producto => {
    totalesPorProducto[producto] = ventasFiltradas
      .filter(v => v.producto === producto)
      .reduce((sum, venta) => sum + Number(venta.piezas), 0);
  });

  const metasPorProducto = {};
  productos.forEach(producto => {
    const meta = metas.find(m =>
      (!filtros.sucursal || filtros.sucursal === 'todos' || Number(m.sucursal_id) === Number(filtros.sucursal)) &&
      m.producto === producto &&
      (!filtros.mes || filtros.mes === 'todos' || m.mes === filtros.mes)
    );
    metasPorProducto[producto] = meta ? Number(meta.meta) : 0;
  });

  const totalPiezas = Object.values(totalesPorProducto).reduce((sum, valor) => sum + valor, 0);
  const metaTotal = Object.values(metasPorProducto).reduce((sum, valor) => sum + valor, 0);
  const avanceGeneral = metaTotal > 0 ? Math.min((totalPiezas / metaTotal) * 100, 100) : 0;

  document.getElementById('totalPiezas').textContent = totalPiezas;
  document.getElementById('metaTotal').textContent = metaTotal;
  document.getElementById('avance').textContent = `${avanceGeneral.toFixed(1)}%`;

  actualizarGraficoAvance(ventasFiltradas, filtros);
}

// Gráfico de avance por sucursal y producto
function actualizarGraficoAvance(ventasFiltradas, filtros) {
  const ctx = document.getElementById('avancePorSucursal').getContext('2d');

  const datosPorSucursal = sucursales.map(sucursal => {
    const ventasSucursal = ventasFiltradas.filter(v => Number(v.sucursal_id) === Number(sucursal.id));

    const productosSucursal = {};
    productos.forEach(producto => {
      productosSucursal[producto] = ventasSucursal
        .filter(v => v.producto === producto)
        .reduce((sum, v) => sum + Number(v.piezas), 0);
    });

    const metasSucursal = {};
    productos.forEach(producto => {
      const meta = metas.find(m =>
        m.producto === producto &&
        m.mes === filtros.mes &&
        Number(m.sucursal_id) === Number(sucursal.id)
      );
      metasSucursal[producto] = meta ? Number(meta.meta) : 0;
    });

    return {
      nombre: sucursal.nombre,
      productos: productosSucursal,
      metas: metasSucursal
    };
  });

  const labels = datosPorSucursal.map(d => d.nombre);
  const datasets = [];

  productos.forEach((producto, index) => {
    datasets.push({
      label: producto,
      data: datosPorSucursal.map(d => d.productos[producto]),
      backgroundColor: [`#3b82f6`, `#ef4444`, `#10b981`, `#f59e0b`][index]
    });
  });

  productos.forEach((producto, index) => {
    datasets.push({
      label: `${producto} (Meta)`,
      data: datosPorSucursal.map(d => d.metas[producto]),
      type: 'line',
      borderColor: [`#3b82f6`, `#ef4444`, `#10b981`, `#f59e0b`][index],
      borderWidth: 2,
      fill: false
    });
  });

  if (avanceChart) {
    avanceChart.data.labels = labels;
    avanceChart.data.datasets = datasets;
    avanceChart.update();
  } else {
    avanceChart = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } }
      }
    });
  }
}

// Registrar venta
document.getElementById('ventaForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const venta = {
    sucursal_id: Number(document.getElementById('sucursal_id').value),
    vendedor_id: Number(document.getElementById('vendedor_id').value),
    producto: document.getElementById('producto').value,
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
  const producto = document.getElementById('metaProducto').value;
  const mes = document.getElementById('metaMes').value;
  const piezasMeta = Number(document.getElementById('metaPiezas').value);

  if (!sucursalId || !producto || !mes || !piezasMeta) {
    return alert('Selecciona sucursal, producto, mes e ingresa piezas');
  }

  try {
    await axios.post('/api/metas', {
      sucursal_id: sucursalId,
      producto,
      mes,
      meta: piezasMeta
    });
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
    producto: document.getElementById('filtroProducto').value,
    mes: document.getElementById('filtroMes').value,
    fecha: document.getElementById('filtroFecha').value
  };
  actualizarDashboard(filtros);
});

// Cargar datos al inicio
document.addEventListener('DOMContentLoaded', cargarDatos);
