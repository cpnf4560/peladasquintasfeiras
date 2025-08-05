const express = require('express');
const app = express();
const port = 3000;

console.log('A iniciar servidor de teste...');

app.get('/', (req, res) => {
  res.send('Servidor de teste a funcionar!');
});

app.listen(port, () => {
  console.log(`Servidor de teste a correr em http://localhost:${port}`);
});
