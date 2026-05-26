const express = require('express');
const router = express.Router();

const sienge1Controller = require('../controllers/sienge1Controller');
const homeController = require('../controllers/homeController');
const customerCompanyController = require('../controllers/customerCompanyController');

// Rotas GET
router.get('/', homeController.home);
router.get('/clearCache', homeController.clearCache);
router.get('/contatos', sienge1Controller.getContatos);
// router.get('/znuny/clientes/adicionar', sienge1Controller.adicionarClienteZnuny);
router.get('/znuny/clientes/sincronizar', sienge1Controller.sincronizarClienteZnuny);

//Rotas PUT
router.put('/sync/:customerId', customerCompanyController.sync);

module.exports = router;