// Importamos el JSON con require
const tablasISR = require("../model/tablasISR.json"); // Asegura que la ruta sea correcta

// VALOR ESTIMADO DE UMA 2025 (Según tu dato)
const UMA = 113.14;

const calcularSBC = (salarioDiario, fechaIngreso) => {
    const hoy = new Date();
    const ingreso = new Date(fechaIngreso);
    const antiguedadMs = hoy - ingreso;
    
    const aniosAntiguedad = antiguedadMs / (1000 * 60 * 60 * 24 * 365.25);

    // Tabla de vacaciones (Ley Federal del Trabajo - Vacaciones Dignas)
    let diasVacaciones = 12;
    if (aniosAntiguedad >= 1) diasVacaciones = 14;
    if (aniosAntiguedad >= 2) diasVacaciones = 16;
    if (aniosAntiguedad >= 3) diasVacaciones = 18;
    if (aniosAntiguedad >= 4) diasVacaciones = 20;
    if (aniosAntiguedad >= 5) diasVacaciones = 22; 

    const diasAguinaldo = 15; 
    const primaVacacionalPorc = 0.25; 

    const numerador = diasAguinaldo + (diasVacaciones * primaVacacionalPorc);
    const factorIntegracion = 1 + (numerador / 365);

    let sbc = salarioDiario * factorIntegracion;

    // Tope 25 UMAs
    const topeSBC = 25 * UMA;
    if (sbc > topeSBC) sbc = topeSBC;

    return Number(sbc.toFixed(2));
};

const calcularISR = (baseGravable, diasPeriodo) => {

    //Obtenemos tablas para el ISR
    const dataTablas = tablasISR.tablas || tablasISR; 

    let tabla = null;
    if (diasPeriodo === 7) tabla = dataTablas.semanal;
    else if (diasPeriodo === 15) tabla = dataTablas.quincenal;
    else if (diasPeriodo === 30) tabla = dataTablas.mensual;
    else tabla = dataTablas.quincenal; // Fallback

    const rango = tabla.slice().reverse().find(row => baseGravable >= row.limite_inferior); 

    if (!rango) return 0;

    const excedente = baseGravable - rango.limite_inferior;
    const impuestoMarginal = excedente * (rango.porcentaje / 100);
    const isrDeterminado = impuestoMarginal + rango.cuota_fija;

    return isrDeterminado; 
};

const calcularIMSS = (sbc, diasPeriodo) => { 
    const totalSBC = sbc * diasPeriodo;
    let cuotaIMSS = 0;

    //Suma de cuotas
    cuotaIMSS += totalSBC * 0.02375;

    // Excedente 3 UMAs
    const limiteExcedente = 3 * UMA;
    if (sbc > limiteExcedente) {
        const diferencia = (sbc - limiteExcedente) * diasPeriodo;
        cuotaIMSS += diferencia * 0.0040;
    }

    return cuotaIMSS;
};

const desglosarGravadoExento = (concepto, monto, aniosAntiguedad = 0) => {
    let exento = 0;
    let gravado = 0;
    const montoValidado = monto || 0;

    switch (concepto) {
        case 'PAGOS_SEPARACION':
            // Regla LISR: Exento equivalente a 90 UMAs por cada año de servicio.
            // Nota: La ley permite redondear a años completos si hay fracción > 6 meses, 
            // pero para el simulador usaremos el dato directo o redondeo simple.
            const aniosParaExencion = Math.round(aniosAntiguedad); 
            const topeSeparacion = 90 * UMA * aniosParaExencion;
            
            exento = montoValidado > topeSeparacion ? topeSeparacion : montoValidado;
            gravado = montoValidado - exento;
            break;

        case 'AGUINALDO':
            const topeAguinaldo = 30 * UMA;
            exento = montoValidado > topeAguinaldo ? topeAguinaldo : montoValidado;
            gravado = montoValidado - exento;
            break;

        case 'PRIMA_VACACIONAL':
            const topePV = 15 * UMA;
            exento = montoValidado > topePV ? topePV : montoValidado;
            gravado = montoValidado - exento;
            break;

        case 'PRIMA_DOMINICAL':
            exento = montoValidado > UMA ? UMA : montoValidado;
            gravado = montoValidado - exento;
            break;

        case 'HE_DOBLES':
            const mitad = montoValidado * 0.50;
            const topeHE = 5 * UMA;
            exento = mitad > topeHE ? topeHE : mitad;
            gravado = montoValidado - exento;
            break;

        case 'HE_TRIPLES':
        case 'SUELDO':
        case 'BONOS':
        default:
            exento = 0;
            gravado = montoValidado;
            break;
    }

    return { 
        montoTotal: Number(montoValidado.toFixed(2)), 
        exento: Number(exento.toFixed(2)), 
        gravado: Number(gravado.toFixed(2)) 
    };
};

module.exports = {
    calcularISR,
    calcularIMSS,
    calcularSBC,
    desglosarGravadoExento,
    UMA 
};