const express = require("express");
const router = express.Router();

// Importamos las funciones del controlador 
const nominaController = require("../controllers/nomina.controller");

// Importamos el middleware para validar los datos del usaurio
const validarMiddleware = require("../middleware/validar.middleware");

// Rutas para la nomina 
router.post("/calcularNomina", validarMiddleware.validarNomina, nominaController.calcularNomina);

// Ruta para el finiquito
router.post("calcularFiniquito", validarMiddleware.validarFiniquito, nominaController.calcularFiniquito);

// Exportamos el router para que el servidor lo use
module.exports = router;