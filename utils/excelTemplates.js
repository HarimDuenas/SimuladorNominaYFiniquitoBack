const ExcelJS = require('exceljs');

const generarExcelRecibo = async (datos, tipo) => {
    const { 
        percepciones, deducciones, 
        totalPercepciones, totalDeducciones, 
        netoPagar, detallesCalculo, datosExtra 
    } = datos;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(tipo === 'finiquito' ? 'Finiquito' : 'Nómina');

    // Definición de columnas
    worksheet.columns = [
        { width: 25 }, 
        { width: 15 }, 
        { width: 5 },  
        { width: 25 }, 
        { width: 15 }  
    ];

    const esFiniquito = tipo === 'finiquito';
    const titulo = esFiniquito ? 'CÁLCULO DE LIQUIDACIÓN Y FINIQUITO' : 'RECIBO DE NÓMINA';

    // Titulo
    worksheet.mergeCells('A1:E1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = titulo;
    titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0056B3' } };
    titleCell.alignment = { horizontal: 'center' };

    // Fecha
    worksheet.mergeCells('A2:E2');
    worksheet.getCell('A2').value = `Fecha de emisión: ${new Date().toLocaleDateString('es-MX')}`;
    worksheet.getCell('A2').alignment = { horizontal: 'right' };

    // Datos
    let currentRow = 4;

    if (esFiniquito && datosExtra) {
        // Finiquito
        worksheet.getCell(`A${currentRow}`).value = 'Fecha Ingreso:';
        worksheet.getCell(`B${currentRow}`).value = datosExtra.fechaIngreso;
        worksheet.getCell(`D${currentRow}`).value = 'Fecha Baja:';
        worksheet.getCell(`E${currentRow}`).value = datosExtra.fechaSalida;
        currentRow++;
        
        worksheet.getCell(`A${currentRow}`).value = 'Antigüedad:';
        worksheet.getCell(`B${currentRow}`).value = `${detallesCalculo.antiguedadAnios} años`;
        worksheet.getCell(`D${currentRow}`).value = 'Motivo:';
        worksheet.getCell(`E${currentRow}`).value = datosExtra.motivoBaja.toUpperCase();
        currentRow++;

        worksheet.getCell(`A${currentRow}`).value = 'SDI:';
        worksheet.getCell(`B${currentRow}`).value = detallesCalculo.sdiIntegrado;
        worksheet.getCell(`B${currentRow}`).numFmt = '"$"#,##0.00';
        currentRow += 2; 
    } else {
        // Nomina
        worksheet.getCell(`A${currentRow}`).value = 'SBC Calculado:';
        worksheet.getCell(`B${currentRow}`).value = detallesCalculo?.sbcCalculado || 0;
        worksheet.getCell(`B${currentRow}`).numFmt = '"$"#,##0.00';
        worksheet.getCell(`D${currentRow}`).value = 'Periodo:';
        worksheet.getCell(`E${currentRow}`).value = 'Ordinario';
        currentRow += 2;
    }

    // Encabezados de tabla
    const headerRow = worksheet.getRow(currentRow);
    headerRow.values = ['PERCEPCIONES', 'IMPORTE', '', 'DEDUCCIONES', 'IMPORTE'];
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    
    worksheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0056B3' } }; 
    worksheet.getCell(`B${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0056B3' } };
    worksheet.getCell(`D${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC0392B' } }; 
    worksheet.getCell(`E${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC0392B' } };

    currentRow++;

    const filaInicioDatos = currentRow;
    const maxRows = Math.max(percepciones.length, deducciones.length);

    // Llenado de tablas
    for (let i = 0; i < maxRows; i++) {
        const row = worksheet.getRow(currentRow + i);
        
        // Percepciones
        if (percepciones[i]) {
            row.getCell(1).value = percepciones[i].concepto;
            row.getCell(2).value = percepciones[i].monto;
            row.getCell(2).numFmt = '"$"#,##0.00';
        }

        // Deducciones
        if (deducciones[i]) {
            row.getCell(4).value = deducciones[i].concepto;
            row.getCell(5).value = deducciones[i].monto;
            row.getCell(5).numFmt = '"$"#,##0.00';
        }
    }

    const filaFinDatos = currentRow + (maxRows > 0 ? maxRows - 1 : 0);
    currentRow += maxRows + 1;

    // Totales con formulas
    const rowTotales = worksheet.getRow(currentRow);
    const filaTotalesNum = currentRow;

    // Total Percepciones 
    rowTotales.getCell(1).value = 'TOTAL PERCEPCIONES';
    rowTotales.getCell(2).value = {
        formula: `SUM(B${filaInicioDatos}:B${filaFinDatos})`,
        result: totalPercepciones
    };
    rowTotales.getCell(2).numFmt = '"$"#,##0.00';
    rowTotales.getCell(2).font = { bold: true };

    // Total Deducciones 
    rowTotales.getCell(4).value = 'TOTAL DEDUCCIONES';
    rowTotales.getCell(5).value = {
        formula: `SUM(E${filaInicioDatos}:E${filaFinDatos})`, 
        result: totalDeducciones
    };
    rowTotales.getCell(5).numFmt = '"$"#,##0.00';
    rowTotales.getCell(5).font = { bold: true };

    currentRow += 2;

    // Neto a pagar
    const rowNeto = worksheet.getRow(currentRow);
    
    rowNeto.getCell(4).value = 'NETO A PAGAR:';
    rowNeto.getCell(4).alignment = { horizontal: 'right' };
    rowNeto.getCell(4).font = { size: 12, bold: true, color: { argb: 'FF004085' } };

    // Valor Calculado
    rowNeto.getCell(5).value = {
        formula: `B${filaTotalesNum} - E${filaTotalesNum}`,
        result: netoPagar
    };
    rowNeto.getCell(5).alignment = { horizontal: 'center' };
    rowNeto.getCell(5).numFmt = '"$"#,##0.00';
    rowNeto.getCell(5).font = { size: 14, bold: true, color: { argb: 'FF004085' } };
    rowNeto.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F4FD' } };
    
    rowNeto.getCell(5).border = {
        top: { style: 'medium' }, left: { style: 'medium' }, bottom: { style: 'medium' }, right: { style: 'medium' }
    };

    return workbook;
};

module.exports = { generarExcelRecibo };