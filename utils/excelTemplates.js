const ExcelJS = require('exceljs');

const generarExcelRecibo = async (datos, tipo) => {
    const { 
        percepciones, deducciones, 
        totalPercepciones, totalDeducciones, 
        netoPagar, detallesCalculo, datosExtra 
    } = datos;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(tipo === 'finiquito' ? 'Finiquito' : 'Nómina');

    // Columnas
    worksheet.columns = [{ width: 25 }, { width: 15 }, { width: 5 }, { width: 25 }, { width: 15 }];

    const esFiniquito = tipo === 'finiquito';
    const titulo = esFiniquito ? 'CÁLCULO DE LIQUIDACIÓN Y FINIQUITO' : 'RECIBO DE NÓMINA';

    // Titulo y Fecha
    worksheet.mergeCells('A1:E1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = titulo;
    titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0056B3' } };
    titleCell.alignment = { horizontal: 'center' };

    worksheet.mergeCells('A2:E2');
    worksheet.getCell('A2').value = `Fecha de emisión: ${new Date().toLocaleDateString('es-MX')}`;
    worksheet.getCell('A2').alignment = { horizontal: 'right' };

    let currentRow = 4;

    worksheet.getCell(`A${currentRow}`).value = 'Nombre:';
    worksheet.getCell(`B${currentRow}`).value = datosExtra?.name?.toUpperCase() || '';
    worksheet.mergeCells(`B${currentRow}:C${currentRow}`);
    worksheet.getCell(`D${currentRow}`).value = 'RFC:';
    worksheet.getCell(`E${currentRow}`).value = datosExtra?.rfc?.toUpperCase() || '';
    currentRow++;

    worksheet.getCell(`A${currentRow}`).value = 'CURP:';
    worksheet.getCell(`B${currentRow}`).value = datosExtra?.curp?.toUpperCase() || '';
    worksheet.mergeCells(`B${currentRow}:C${currentRow}`);
    worksheet.getCell(`D${currentRow}`).value = 'NSS:';
    worksheet.getCell(`E${currentRow}`).value = datosExtra?.nss || '';
    currentRow++;

    worksheet.getCell(`A${currentRow}`).value = 'Puesto:';
    worksheet.getCell(`B${currentRow}`).value = datosExtra?.job?.toUpperCase() || '';
    worksheet.mergeCells(`B${currentRow}:C${currentRow}`);
    worksheet.getCell(`D${currentRow}`).value = 'Depto:';
    worksheet.getCell(`E${currentRow}`).value = datosExtra?.department?.toUpperCase() || '';
    currentRow++;

    worksheet.getCell(`A${currentRow}`).value = 'Salario Diario:';
    worksheet.getCell(`B${currentRow}`).value = datosExtra?.salary || 0;
    worksheet.getCell(`B${currentRow}`).numFmt = '"$"#,##0.00';
    worksheet.getCell(`D${currentRow}`).value = 'Periodo:';
    worksheet.getCell(`E${currentRow}`).value = datosExtra?.period || '';
    
    currentRow += 2; 

    if (esFiniquito && datosExtra) {
        worksheet.getCell(`A${currentRow}`).value = 'Fecha Ingreso:';
        worksheet.getCell(`B${currentRow}`).value = datosExtra.fechaIngreso;
        worksheet.getCell(`D${currentRow}`).value = 'Fecha Baja:';
        worksheet.getCell(`E${currentRow}`).value = datosExtra.fechaSalida;
        currentRow++;
        
        worksheet.getCell(`A${currentRow}`).value = 'Antigüedad:';
        worksheet.getCell(`B${currentRow}`).value = `${detallesCalculo.antiguedadAnios} años`;
        worksheet.getCell(`D${currentRow}`).value = 'Motivo:';
        worksheet.getCell(`E${currentRow}`).value = (datosExtra.motivoBaja || '').toUpperCase();
        currentRow += 2;
    } 

    const headerRow = worksheet.getRow(currentRow);
    headerRow.values = ['PERCEPCIONES', 'IMPORTE', '', 'DEDUCCIONES', 'IMPORTE'];
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    
    worksheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0056B3' } }; 
    worksheet.getCell(`B${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0056B3' } };
    worksheet.getCell(`D${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC0392B' } }; 
    worksheet.getCell(`E${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC0392B' } };

    currentRow++;

    // Llenado de tablas
    const filaInicioDatos = currentRow;
    const maxRows = Math.max(percepciones.length, deducciones.length);

    for (let i = 0; i < maxRows; i++) {
        const row = worksheet.getRow(currentRow + i);
        if (percepciones[i]) {
            row.getCell(1).value = percepciones[i].concepto;
            row.getCell(2).value = percepciones[i].monto;
            row.getCell(2).numFmt = '"$"#,##0.00';
        }
        if (deducciones[i]) {
            row.getCell(4).value = deducciones[i].concepto;
            row.getCell(5).value = deducciones[i].monto;
            row.getCell(5).numFmt = '"$"#,##0.00';
        }
    }

    const filaFinDatos = currentRow + (maxRows > 0 ? maxRows - 1 : 0);
    currentRow += maxRows + 1;

    // Totales y Neto
    const rowTotales = worksheet.getRow(currentRow);
    const filaTotalesNum = currentRow;

    rowTotales.getCell(1).value = 'TOTAL PERCEPCIONES';
    rowTotales.getCell(2).value = { formula: `SUM(B${filaInicioDatos}:B${filaFinDatos})`, result: totalPercepciones };
    rowTotales.getCell(2).numFmt = '"$"#,##0.00';
    rowTotales.getCell(2).font = { bold: true };

    rowTotales.getCell(4).value = 'TOTAL DEDUCCIONES';
    rowTotales.getCell(5).value = { formula: `SUM(E${filaInicioDatos}:E${filaFinDatos})`, result: totalDeducciones };
    rowTotales.getCell(5).numFmt = '"$"#,##0.00';
    rowTotales.getCell(5).font = { bold: true };

    currentRow += 2;

    const rowNeto = worksheet.getRow(currentRow);
    rowNeto.getCell(4).value = 'NETO A PAGAR:';
    rowNeto.getCell(4).alignment = { horizontal: 'right' };
    rowNeto.getCell(4).font = { size: 12, bold: true, color: { argb: 'FF004085' } };

    rowNeto.getCell(5).value = { formula: `B${filaTotalesNum} - E${filaTotalesNum}`, result: netoPagar };
    rowNeto.getCell(5).alignment = { horizontal: 'center' };
    rowNeto.getCell(5).numFmt = '"$"#,##0.00';
    rowNeto.getCell(5).font = { size: 14, bold: true, color: { argb: 'FF004085' } };
    rowNeto.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F4FD' } };
    rowNeto.getCell(5).border = { top: { style: 'medium' }, left: { style: 'medium' }, bottom: { style: 'medium' }, right: { style: 'medium' } };

    currentRow += 3;
        
    // Disclaimer
    worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
    const disclaimerCell = worksheet.getCell(`A${currentRow}`);
    disclaimerCell.value = `AVISO LEGAL: Los calculos presentados son estimaciones basadas en las variables (UMA, tablas ISR y cuotas IMSS) vigentes en 2025. Se recomienda validar con un especialista contable.`;
    disclaimerCell.font = { size: 9, italic: true, color: { argb: 'FF555555' } }; 
    disclaimerCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }; 
    worksheet.getRow(currentRow).height = 45;

    return workbook;
};

module.exports = { generarExcelRecibo };