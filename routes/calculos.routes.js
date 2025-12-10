const express = require("express");
const router = express.Router();

// Importamos las funciones del controlador 
const calculosController = require("../controllers/calculos.controller");

// Importamos el middleware (Asegúrate de que exportes estos nombres en tu archivo middleware)
const validarMiddleware = require("../middleware/validar.middleware");

//  TODAVIA FALTA VALIDAR LAS ENTRADAS DEL MIDDLEWARE

// Ruta 1: Calcular Percepciones 
router.post("/calcular-percepciones", validarMiddleware.validarPercepciones, calculosController.calcularPercepciones); 

// Ruta 2: Calcular Deducciones (Recibe datos ya procesados, validación ligera opcional)
router.post("/calcular-deducciones", validarMiddleware.validarDeducciones, calculosController.calcularDeducciones);

// Ruta 3: Estructurar Nómina Final
router.post('/calcular-nomina', calculosController.calcularNomina);

// Ruta 4: Estructurar Finiquito Final (CORREGIDO: Ruta única)
router.post('/calcular-finiquito', calculosController.calcularFiniquito);

module.exports = router;