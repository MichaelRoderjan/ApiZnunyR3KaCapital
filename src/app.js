const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();

app.use(cors());

// 🔥 AUMENTANDO LIMITE DO PAYLOAD
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ limit: '30mb', extended: true }));

// Suas rotas
app.use('/', routes);

module.exports = app;
