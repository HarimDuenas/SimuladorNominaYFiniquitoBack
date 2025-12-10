const generarHtmlRecibo = (datos, tipo) => {
    const {
        percepciones,
        deducciones,
        totalPercepciones,
        totalDeducciones,
        netoPagar,
        detallesCalculo,
        datosExtra
    } = datos;

    const esFiniquito = (tipo === 'finiquito');
    const titulo = esFiniquito ? 'LIQUIDACIÓN Y FINIQUITO' : 'RECIBO DE NÓMINA';
    const fechaImpresion = new Date().toLocaleDateString('es-MX');

    // Hacemos la moneda bonita
    const moneda = (monto) =>
        new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(monto);

    // Filas de las tablas
    const filasPercepciones = percepciones.map(p => `
        <tr><td>${p.concepto}</td><td class="monto">${moneda(p.monto)}</td></tr>
    `).join('');

    const filasDeducciones = deducciones.map(d => `
        <tr><td>${d.concepto}</td><td class="monto">${moneda(d.monto)}</td></tr>
    `).join('');

    // DATOS ESPECIFICOS PARA FINIQUITO
    let infoExtraHtml = '';
    
    if (esFiniquito && datosExtra) {
        infoExtraHtml = `
        <div class="box-datos-laborales">
            <h3>Detalles de la Relación Laboral</h3>
            <table class="tabla-datos">
                <tr>
                    <td><strong>Fecha de Ingreso:</strong> ${datosExtra.fechaIngreso}</td>
                    <td><strong>Fecha de Baja:</strong> ${datosExtra.fechaSalida}</td>
                </tr>
                <tr>
                    <td><strong>Antigüedad:</strong> ${detallesCalculo.antiguedadAnios} años</td>
                    <td><strong>Motivo Baja:</strong> ${datosExtra.motivoBaja.replace('_', ' ').toUpperCase()}</td>
                </tr>
                <tr>
                    <td><strong>Salario Diario Integrado (SDI):</strong> ${moneda(detallesCalculo.sdiIntegrado)}</td>
                    <td><strong>Días Pendientes Pago:</strong> ${datosExtra.diasSalarioPendientes || 0}</td>
                </tr>
            </table>
        </div>
        `;
    } else {
        // nomina 
        infoExtraHtml = `
        <table class="info-box">
            <tr>
                <td><strong>SBC para IMSS:</strong> ${moneda(detallesCalculo?.sbcCalculado || 0)}</td>
                <td><strong>Periodo:</strong> Nómina Ordinaria</td>
            </tr>
        </table>`;
    }

    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: 'Arial', sans-serif; color: #333; padding: 40px; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 3px solid #0056b3; padding-bottom: 10px; }
            .header h1 { margin: 0; color: #004085; font-size: 26px; }
            .sub-header { text-align: right; font-size: 11px; color: #777; margin-bottom: 20px; }
            
            .box-datos-laborales { background: #f8f9fa; border: 1px solid #ddd; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
            .box-datos-laborales h3 { margin-top: 0; font-size: 14px; color: #444; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
            
            .tabla-datos { width: 100%; font-size: 12px; }
            .tabla-datos td { padding: 5px; vertical-align: top; width: 50%; }

            .columns { display: flex; justify-content: space-between; gap: 30px; }
            .column { width: 48%; }
            
            table.conceptos { width: 100%; border-collapse: collapse; font-size: 11px; }
            table.conceptos th { background-color: #0056b3; color: white; text-align: left; padding: 8px; }
            table.conceptos td { padding: 6px 8px; border-bottom: 1px solid #eee; }
            .monto { text-align: right; font-family: 'Courier New', monospace; font-weight: bold; }
            
            .total-section { margin-top: 10px; border-top: 2px solid #333; padding-top: 5px; display: flex; justify-content: space-between; font-weight: bold; font-size: 12px; }
            
            .neto-box { margin-top: 40px; text-align: right; padding: 10px; background: #e8f4fd; border-radius: 5px; border: 1px solid #b8daff; }
            .neto-label { font-size: 14px; color: #004085; }
            .neto-monto { font-size: 28px; color: #0056b3; font-weight: bold; }

            .legal-text { font-size: 10px; text-align: justify; margin-top: 30px; color: #666; }
            .firmas { margin-top: 80px; display: flex; justify-content: space-around; }
            .firma-linea { border-top: 1px solid #000; width: 40%; text-align: center; padding-top: 5px; font-size: 12px; }
        </style>
    </head>
    <body>

        <div class="header">
            <h1>${titulo}</h1>
        </div>
        <div class="sub-header">Fecha de Emisión: ${fechaImpresion}</div>

        ${infoExtraHtml}

        <div class="columns">
            <div class="column">
                <table class="conceptos">
                    <thead><tr><th>PERCEPCIONES</th><th class="monto">IMPORTE</th></tr></thead>
                    <tbody>${filasPercepciones}</tbody>
                </table>
                <div class="total-section">
                    <span>TOTAL PERCEPCIONES</span>
                    <span>${moneda(totalPercepciones)}</span>
                </div>
            </div>

            <div class="column">
                <table class="conceptos">
                    <thead><tr><th>DEDUCCIONES</th><th class="monto">IMPORTE</th></tr></thead>
                    <tbody>${filasDeducciones}</tbody>
                </table>
                <div class="total-section">
                    <span>TOTAL DEDUCCIONES</span>
                    <span>${moneda(totalDeducciones)}</span>
                </div>
            </div>
        </div>

        <div class="neto-box">
            <span class="neto-label">NETO A RECIBIR:</span>
            <div class="neto-monto">${moneda(netoPagar)}</div>
        </div>

        ${esFiniquito ? `<p class="legal-text">
            Recibo a mi entera conformidad la cantidad neta descrita, por concepto de mi liquidación y finiquito laboral, 
            declarando que no se me adeuda cantidad alguna por concepto de salarios, prestaciones o indemnizaciones, 
            otorgando el más amplio finiquito que en derecho proceda.
        </p>` : ''}
    </body>
    </html>
    `;
};

module.exports = { generarHtmlRecibo };
