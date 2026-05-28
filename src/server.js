/**
 * Engineering Career Navigator — Express Server
 * DAA Project 2025 — Dijkstra's Shortest Path Algorithm
 *
 * Run:  node src/server.js
 * Dev:  npx nodemon src/server.js
 * Open: http://localhost:3000
 */

const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// Serve everything in /public as static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Root → index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// 404 fallback
app.use((req, res) => {
  res.status(404).send('Not found — navigate to <a href="/">Home</a>');
});

app.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════════╗');
  console.log('  ║   Engineering Career Navigator — DAA 2025   ║');
  console.log('  ╠══════════════════════════════════════════════╣');
  console.log(`  ║   Server running at http://localhost:${PORT}   ║`);
  console.log('  ║   Ctrl+C to stop                            ║');
  console.log('  ╚══════════════════════════════════════════════╝');
  console.log('');
});
