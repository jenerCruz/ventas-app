const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Rutas a los archivos JSON
const ventasPath = path.join(__dirname, 'data', 'ventas.json');
const sucursalesPath = path.join(__dirname, 'data', 'sucursales.json');
const vendedoresPath = path.join(__dirname, 'data', 'vendedores.json');

// Leer archivo JSON
const readJSON = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Escribir archivo JSON
const writeJSON = (filePath, data) => fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

// API para ventas
app.get('/api/ventas', (req, res) => {
  const ventas = readJSON(ventasPath);
  res.json(ventas);
});

app.post('/api/ventas', (req, res) => {
  const ventas = readJSON(ventasPath);
  const nuevaVenta = { id: ventas.length + 1, ...req.body };
  ventas.push(nuevaVenta);
  writeJSON(ventasPath, ventas);
  res.status(201).json(nuevaVenta);
});

// API para sucursales
app.get('/api/sucursales', (req, res) => {
  const sucursales = readJSON(sucursalesPath);
  res.json(sucursales);
});

// API para vendedores
app.get('/api/vendedores', (req, res) => {
  const vendedores = readJSON(vendedoresPath);
  res.json(vendedores);
});

// Iniciar servidor
app.listen(3000, () => {
  console.log('Backend en http://localhost:3000');
});
