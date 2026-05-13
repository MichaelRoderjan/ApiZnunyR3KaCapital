const express = require('express');

const app = require('./src/app.js');

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));