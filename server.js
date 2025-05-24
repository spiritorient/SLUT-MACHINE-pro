// server.js
const express = require('express');
const morgan  = require('morgan');
const path    = require('path');

const app = express();

// Log incoming requests in “combined” Apache format
app.use(morgan('combined'));

// Serve your static folder (adjust if your files are in a subfolder)
app.use(express.static(path.join(__dirname, 'slut-masina')));

// Fallback to index.html for SPA-style routes (optional)
// app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'slut-masina/index.html')));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}`));