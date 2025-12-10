const express = require("express");
const router = express.Router();
const documentosController = require("../controllers/documentos.controller");

// ruta para genera el PDf de la nomina
router.post("/generar-pdf", documentosController.generarDocumentosPdf);

// Ruta Excel
router.post("/generar-excel", documentosController.generarDocumentosExcel);

module.exports = router;