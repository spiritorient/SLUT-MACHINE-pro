const express = require('express');
const morgan  = require('morgan');
const path    = require('path');

const app = express();

// Parse JSON bodies
app.use(express.json());

// Skip asset logs, only show POST /log and GET /
app.use(morgan('combined', {
  skip: req => req.path.match(/\.(js|css|png|jpe?g|gif|ico|mp3|wav)$/)
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'slut-masina')));

// New: game-event logging endpoint
app.post('/log', (req, res) => {
  // Example payload: { event: 'spin', outcome: ['symbol1','symbol2','symbol3'], score: 279 }
  console.log('[GAME EVENT]', JSON.stringify(req.body));
  res.sendStatus(204);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}`));