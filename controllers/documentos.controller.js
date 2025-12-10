const puppeteer = require('puppeteer');

const { generarHtmlRecibo } = require('../utils/pdfTemplates');
const { generarExcelRecibo } = require('../utils/excelTemplates');

const generarDocumentosPdf = async (req, res) => {
    try {
        // Obtenemos los datos calculados desde el body
        const { datosCalculo, tipo } = req.body; 

        if (!datosCalculo || !tipo) {
            return res.status(400).json({ mensaje: "Faltan datos de cálculo o el tipo de documento." });
        }

        // Generamos el contenido HTML
        const htmlContent = generarHtmlRecibo(datosCalculo, tipo);

        // Iniciamos Puppeteer
        const browser = await puppeteer.launch({
            headless: 'new', // Modo sin cabeza (background)
            args: ['--no-sandbox', '--disable-setuid-sandbox'] // Argumentos de seguridad estándar para servidores
        });

        const page = await browser.newPage();

        // Cargar el HTML en la página virtual
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        // Generaramos el PDF
        const pdfBuffer = await page.pdf({
            format: 'Letter',
            printBackground: true, // Para imprimir colores de fondo
            margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
        });

        await browser.close();

        // Configuracion headers para descarga
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Length': pdfBuffer.length,
            'Content-Disposition': `attachment; filename=calculo_${tipo}_${Date.now()}.pdf`
        });

        // Enviar el buffer del pdf
        res.send(pdfBuffer);

    } catch (error) {
        console.error("Error generando PDF:", error);
        res.status(500).json({ mensaje: "Error al generar el documento PDF." });
    }
};

const generarDocumentosExcel = async (req, res) => {
    try {
        const { datosCalculo, tipo } = req.body;

        if (!datosCalculo || !tipo) {
            return res.status(400).json({ mensaje: "Faltan datos de cálculo o el tipo de documento." });
        }

        // Generar el libro de Excel
        const workbook = await generarExcelRecibo(datosCalculo, tipo);

        // Configurar headers para descarga
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=calculo_${tipo}_${Date.now()}.xlsx`
        );

        // Escribir directamente al buffer de respuesta
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error("Error generando Excel:", error);
        res.status(500).json({ mensaje: "Error al generar el documento Excel." });
    }
};

module.exports = {
    generarDocumentosPdf,
    generarDocumentosExcel
};