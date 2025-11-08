const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const readJSON = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify([]));
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error(`Error al leer ${filePath}:`, error);
    return [];
  }
};

const writeJSON = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error al escribir ${filePath}:`, error);
  }
};

const ventasPath = path.join(dataDir, 'ventas.json');
const sucursalesPath = path.join(dataDir, 'sucursales.json');
const vendedoresPath = path.join(dataDir, 'vendedores.json');
const metasPath = path.join(dataDir, 'metas.json');

[ventasPath, sucursalesPath, vendedoresPath, metasPath].forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([]));
  }
});

// API para ventas
app.get('/api/ventas', (req, res) => {
  const ventas = readJSON(ventasPath);
  res.json(ventas);
});

app.post('/api/ventas', (req, res) => {
  const ventas = readJSON(ventasPath);
  const { sucursal_id, vendedor_id, producto, piezas } = req.body;
  const nuevaVenta = {
    id: ventas.length > 0 ? Math.max(...ventas.map(v => v.id)) + 1 : 1,
    sucursal_id,
    vendedor_id,
    producto,
    piezas,
    fecha: req.body.fecha || new Date().toISOString().split('T')[0]
  };
  ventas.push(nuevaVenta);
  writeJSON(ventasPath, ventas);
  res.status(201).json(nuevaVenta);
});

// API para metas
app.get('/api/metas', (req, res) => {
  const metas = readJSON(metasPath);
  res.json(metas);
});

app.post('/api/metas', (req, res) => {
  const metas = readJSON(metasPath);
  const { sucursal_id, producto, mes, meta } = req.body;
  const index = metas.findIndex(m =>
    m.sucursal_id === sucursal_id &&
    m.producto === producto &&
    m.mes === mes
  );
  if (index >= 0) {
    metas[index].meta = meta;
  } else {
    metas.push({ sucursal_id, producto, mes, meta });
  }
  writeJSON(metasPath, metas);
  res.status(201).json(metas);
});

// API para sucursales y vendedores
app.get('/api/sucursales', (req, res) => {
  const sucursales = readJSON(sucursalesPath);
  res.json(sucursales);
});

app.get('/api/vendedores', (req, res) => {
  const vendedores = readJSON(vendedoresPath);
  res.json(vendedores);
});

// Ruta para servir el index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});
