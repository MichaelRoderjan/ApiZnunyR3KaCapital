const express = require('express');
const router = express.Router()
const sienge1Controller = require('../controllers/sienge1Controller');
const homeController = require('../controllers/homeController');

//Rotas GET
router.get('/', homeController.home)
router.get('/contatos', sienge1Controller.getContatos);

module.exports = router;