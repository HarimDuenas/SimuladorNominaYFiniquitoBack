const metodosCalculos = require("../utils/metodosCalculos");

//Funcion para calcular las percepciones
const calcularPercepciones = (req, res) => {
    const { tipo } = req.query; 

    try {
        if (tipo === 'nomina') {
            const { 
                salarioDiario, fechaIngreso, diasTrabajados,
                horasExtraDobles, horasExtraTriples, primaDominical, otrosBonos 
            } = req.body;

            // Calculos Básicos
            const montoSueldo = salarioDiario * diasTrabajados;
            const montoPrimaDominical = primaDominical ? (salarioDiario * 0.25) : 0;
            const valorHora = salarioDiario / 8;
            const montoHEDobles = valorHora * 2 * horasExtraDobles;
            const montoHETriples = valorHora * 3 * horasExtraTriples;

            // Division en gravados y excentos
            const desgloseSueldo = metodosCalculos.desglosarGravadoExento('SUELDO', montoSueldo);
            const desglosePrima = metodosCalculos.desglosarGravadoExento('PRIMA_DOMINICAL', montoPrimaDominical);
            const desgloseHEDobles = metodosCalculos.desglosarGravadoExento('HE_DOBLES', montoHEDobles);
            const desgloseHETriples = metodosCalculos.desglosarGravadoExento('HE_TRIPLES', montoHETriples);
            
            // Procesamiento de OTROS BONOS (Array)
            let totalBonosMonto = 0;
            let totalBonosGravado = 0;
            let listaBonosParaResponse = [];

            // Verificamos que sea un array válido
            if (Array.isArray(otrosBonos) && otrosBonos.length > 0) {
                otrosBonos.forEach(bono => {
                    const montoBono = Number(bono.percepcion) || 0;
                    const nombreBono = bono.nombre || "Bono General";

                    // Acumulamos el monto total
                    totalBonosMonto += montoBono;

                    // Calculamos la parte gravada de este bono específico
                    const desglose = metodosCalculos.desglosarGravadoExento('BONOS', montoBono);
                    totalBonosGravado += desglose.gravado;

                    // Preparamos el objeto para el array 'percepciones' de la respuesta
                    listaBonosParaResponse.push({
                        concepto: nombreBono,
                        monto: Number(montoBono.toFixed(2))
                    });
                });
            }

            // Sumamos Bases Gravables Totales
            const baseGravableISR = 
                desgloseSueldo.gravado + 
                desglosePrima.gravado + 
                desgloseHEDobles.gravado + 
                desgloseHETriples.gravado + 
                totalBonosGravado;

            const totalPercepciones = montoSueldo + montoPrimaDominical + montoHEDobles + montoHETriples + totalBonosMonto;
            
            const sbc = metodosCalculos.calcularSBC(salarioDiario, fechaIngreso);

            res.status(200).json({
                totalPercepciones: Number(totalPercepciones.toFixed(2)),
                baseGravableISR: Number(baseGravableISR.toFixed(2)),
                parteExentaTotal: Number((totalPercepciones - baseGravableISR).toFixed(2)),
                sbcCalculado: sbc,
                percepciones: [
                    { concepto: `Sueldo (${diasTrabajados} días)`, monto: Number(montoSueldo.toFixed(2)) },
                    ...(montoPrimaDominical > 0 ? [{ concepto: "Prima Dominical", monto: Number(montoPrimaDominical.toFixed(2)) }] : []),
                    ...(montoHEDobles > 0 ? [{ concepto: "Horas Extra Dobles", monto: Number(montoHEDobles.toFixed(2)) }] : []),
                    ...(montoHETriples > 0 ? [{ concepto: "Horas Extra Triples", monto: Number(montoHETriples.toFixed(2)) }] : []),
                    // Esparcimos (...) la lista de bonos procesada
                    ...listaBonosParaResponse
                ]
            });

        } else {
            const { 
                salarioDiario, fechaIngreso, fechaSalida, motivoBaja,
                diasVacacionesPendientes, diasSalarioPendientes, otrosBonos 
            } = req.body;

            const ingreso = new Date(fechaIngreso);
            const salida = new Date(fechaSalida);
            const diferenciaTiempo = salida - ingreso;
            const antiguedadAnios = diferenciaTiempo / (1000 * 60 * 60 * 24 * 365.25);
            const sdi = metodosCalculos.calcularSBC(salarioDiario, fechaIngreso);
            
            let percepcionesList = [];
            let totalGravadoOrdinario = 0;
            let totalGravadoSeparacion = 0;

            // --- A. Ordinarios ---
            const montoSalarios = salarioDiario * diasSalarioPendientes;
            percepcionesList.push({ concepto: `Salario (${diasSalarioPendientes} días pendientes)`, monto: montoSalarios });
            totalGravadoOrdinario += metodosCalculos.desglosarGravadoExento('SUELDO', montoSalarios).gravado;

            const montoVacaciones = salarioDiario * diasVacacionesPendientes;
            percepcionesList.push({ concepto: `Vacaciones Pendientes (${diasVacacionesPendientes} días)`, monto: montoVacaciones });
            totalGravadoOrdinario += metodosCalculos.desglosarGravadoExento('SUELDO', montoVacaciones).gravado;

            const montoPrimaVac = montoVacaciones * 0.25;
            percepcionesList.push({ concepto: "Prima Vacacional (25%)", monto: montoPrimaVac });
            totalGravadoOrdinario += metodosCalculos.desglosarGravadoExento('PRIMA_VACACIONAL', montoPrimaVac).gravado;

            // Aguinaldo Proporcional
            const inicioAnio = new Date(salida.getFullYear(), 0, 1);
            const fechaConteo = ingreso > inicioAnio ? ingreso : inicioAnio;
            const diasTrabajadosAnio = (salida - fechaConteo) / (1000 * 60 * 60 * 24);
            const montoAguinaldo = (diasTrabajadosAnio / 365) * 15 * salarioDiario;
            percepcionesList.push({ concepto: "Aguinaldo Proporcional", monto: montoAguinaldo });
            totalGravadoOrdinario += metodosCalculos.desglosarGravadoExento('AGUINALDO', montoAguinaldo).gravado;

            // Se procesan igual que en nómina pero se suman al Gravado Ordinario del finiquito
            if (Array.isArray(otrosBonos) && otrosBonos.length > 0) {
                otrosBonos.forEach(bono => {
                    const montoBono = Number(bono.percepcion) || 0;
                    const nombreBono = bono.nombre || "Bono Pendiente";

                    // Agregamos a la lista visual
                    percepcionesList.push({ concepto: nombreBono, monto: Number(montoBono.toFixed(2)) });

                    // Calculamos gravado (Usualmente 100%) y sumamos a la base ordinaria
                    const desglose = metodosCalculos.desglosarGravadoExento('BONOS', montoBono);
                    totalGravadoOrdinario += desglose.gravado;
                });
            }

            // --- B. Separación (Indemnizaciones) ---
            let montoSeparacionAcumulado = 0;

            let aplicaAntiguedad = false;
            if (["despido_injustificado", "despido_justificado", "incapacidad_permanente", "defuncion"].includes(motivoBaja)) {
                aplicaAntiguedad = true;
            } else if (motivoBaja === "renuncia_voluntaria" && antiguedadAnios >= 15) {
                aplicaAntiguedad = true;
            }

            if (aplicaAntiguedad) {
                const dobleUMA = 2 * metodosCalculos.UMA;
                const salarioBaseAntiguedad = salarioDiario > dobleUMA ? dobleUMA : salarioDiario;
                const montoPrimaAntiguedad = 12 * antiguedadAnios * salarioBaseAntiguedad;
                montoSeparacionAcumulado += montoPrimaAntiguedad;
                percepcionesList.push({ concepto: "Prima de Antigüedad", monto: montoPrimaAntiguedad });
            }

            if (motivoBaja === "despido_injustificado") {
                const monto3M = 90 * sdi;
                const monto20D = 20 * antiguedadAnios * sdi;
                montoSeparacionAcumulado += (monto3M + monto20D);
                percepcionesList.push({ concepto: "Indemnización (3 meses)", monto: monto3M });
                percepcionesList.push({ concepto: "Indemnización (20 días/año)", monto: monto20D });
            }

            if (montoSeparacionAcumulado > 0) {
                const desglose = metodosCalculos.desglosarGravadoExento('PAGOS_SEPARACION', montoSeparacionAcumulado, antiguedadAnios);
                totalGravadoSeparacion = desglose.gravado;
            }

            const totalPercepciones = percepcionesList.reduce((sum, item) => sum + item.monto, 0);

            res.status(200).json({
                totalPercepciones: Number(totalPercepciones.toFixed(2)),
                detallesCalculo: {
                    antiguedadAnios: Number(antiguedadAnios.toFixed(2)),
                    sdiIntegrado: Number(sdi.toFixed(2)),
                    baseGravableOrdinaria: Number(totalGravadoOrdinario.toFixed(2)),
                    baseGravableSeparacion: Number(totalGravadoSeparacion.toFixed(2))
                },
                percepciones: percepcionesList.map(p => ({ ...p, monto: Number(p.monto.toFixed(2)) })),
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error interno al calcular las percepciones" });
    }
}

const calcularDeducciones = (req, res) => {
    const { tipo } = req.query; 

    try {
        if (tipo === 'nomina') {
            const { 
                salarioDiario, diasPeriodo, faltas, adeudos, // Datos originales
                baseGravableISR, sbcCalculado // Datos calculados en el paso anterior (Percepciones)
            } = req.body;

            // Calcular Deducciones de Ley (ISR e IMSS)
            const isr = metodosCalculos.calcularISR(baseGravableISR, diasPeriodo);
            const imss = metodosCalculos.calcularIMSS(sbcCalculado, diasPeriodo);

            // Calcular faltas
            const montoFaltas = (Number(salarioDiario) * Number(faltas)) || 0; 

            // Procesar ADEUDOS (Array dinámico)
            let totalAdeudos = 0;
            let listaAdeudos = [];

            if (Array.isArray(adeudos) && adeudos.length > 0) {
                adeudos.forEach(ad => {
                    const monto = Number(ad.deduccion) || 0;
                    const nombre = ad.nombre || "Adeudo General";
                    
                    totalAdeudos += monto;
                    listaAdeudos.push({ concepto: nombre, monto: Number(monto.toFixed(2)) });
                });
            }

            // Totales (Sin Neto)
            const totalDeducciones = isr + imss + montoFaltas + totalAdeudos;

            res.status(200).json({
                totalDeducciones: Number(totalDeducciones.toFixed(2)),
                detallesCalculo: {
                    baseGravableISR: Number(baseGravableISR.toFixed(2)),
                    sbcUsado: Number(sbcCalculado.toFixed(2)),
                    isrDeterminado: Number(isr.toFixed(2)),
                    imssDeterminado: Number(imss.toFixed(2))
                },
                deducciones: [
                    { concepto: "ISR (Impuesto Sobre la Renta)", monto: Number(isr.toFixed(2)) },
                    { concepto: "IMSS (Cuota Obrero)", monto: Number(imss.toFixed(2)) },
                    ...(montoFaltas > 0 ? [{ concepto: `Falta (${faltas} días)`, monto: Number(montoFaltas.toFixed(2)) }] : []),
                    ...listaAdeudos // Agregamos los adeudos dinámicos al final
                ]
            });
        } else {
            const { 
                adeudos, // Datos originales
                baseGravableOrdinaria, baseGravableSeparacion // Datos calculados en el paso anterior
            } = req.body;

            // Calcular ISR (Ordinario y Separación)
            const isrOrdinario = metodosCalculos.calcularISR(baseGravableOrdinaria, 30);
            
            let isrSeparacion = 0;
            if (baseGravableSeparacion > 0) {
                isrSeparacion = metodosCalculos.calcularISR(baseGravableSeparacion, 30);
            }

            const totalISR = isrOrdinario + isrSeparacion;

            // Procesar ADEUDOS (Array dinámico)
            let totalAdeudos = 0;
            let listaAdeudos = [];

            if (Array.isArray(adeudos) && adeudos.length > 0) {
                adeudos.forEach(ad => {
                    const monto = Number(ad.deduccion) || 0;
                    const nombre = ad.nombre || "Adeudo Liquidación";
                    
                    totalAdeudos += monto;
                    listaAdeudos.push({ concepto: nombre, monto: Number(monto.toFixed(2)) });
                });
            }

            // Totales (Sin Neto)
            const totalDeducciones = totalISR + totalAdeudos;

            // Construcción de respuesta
            let deduccionesList = [
                { concepto: "ISR (Impuesto por liquidación)", monto: Number(totalISR.toFixed(2)) },
                ...listaAdeudos
            ];

            res.status(200).json({
                totalDeducciones: Number(totalDeducciones.toFixed(2)),
                detallesCalculo: {
                    baseGravableOrdinaria: Number(baseGravableOrdinaria.toFixed(2)),
                    baseGravableSeparacion: Number(baseGravableSeparacion.toFixed(2)),
                    isrOrdinario: Number(isrOrdinario.toFixed(2)),
                    isrSeparacion: Number(isrSeparacion.toFixed(2))
                },
                deducciones: deduccionesList
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error interno al calcular las deducciones" });
    }
}


// Funcion para calcular Nomina
const calcularNomina = (req, res) => {
    try {
        // Asumimos que el "Front" o el paso anterior envía los resultados ya procesados
        const { 
            totalPercepciones, 
            totalDeducciones, 
            percepciones,      // Array detallado de percepciones
            deducciones,       // Array detallado de deducciones
            detallesCalculo    // Objeto con sbcCalculado, baseGravable, etc.
        } = req.body;

        // CALCULO FINAL: NETO A PAGAR
        const netoPagar = Number(totalPercepciones) - Number(totalDeducciones);

        // ESTRUCTURACIÓN DE LA RESPUESTA 
        const respuestaNomina = {
            netoPagar: Number(netoPagar.toFixed(2)),
            totalPercepciones: Number(totalPercepciones),
            totalDeducciones: Number(totalDeducciones),
            detallesCalculo: {
                // Pasamos los detalles técnicos que ya venían calculados
                sbcCalculado: detallesCalculo?.sbcCalculado || 0,
                baseGravableISR: detallesCalculo?.baseGravableISR || 0,
                // Puedes agregar aquí el ISR e IMSS determinados si deseas transparencia
                isrDeterminado: detallesCalculo?.isrDeterminado || 0,
                imssDeterminado: detallesCalculo?.imssDeterminado || 0
            },
            percepciones: percepciones || [], // Array de { concepto, monto }
            deducciones: deducciones || []    // Array de { concepto, monto }
        };

        res.status(200).json(respuestaNomina);

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error interno al estructurar la nómina" });
    }
};

const calcularFiniquito = (req, res) => {
    try {
        // Recibimos los datos ya procesados de percepciones (ordinarias+indemnización) y deducciones (ISR+adeudos)
        const { 
            totalPercepciones, 
            totalDeducciones, 
            percepciones,      // Array detallado
            deducciones,       // Array detallado
            detallesCalculo    // Objeto con antiguedad, sdi, bases gravables
        } = req.body;

        // CALCULO FINAL: NETO A PAGAR
        const netoPagar = Number(totalPercepciones) - Number(totalDeducciones);

        // ESTRUCTURACIÓN DE LA RESPUESTA
        const respuestaFiniquito = {
            netoPagar: Number(netoPagar.toFixed(2)),
            totalPercepciones: Number(totalPercepciones),
            totalDeducciones: Number(totalDeducciones),
            detallesCalculo: {
                // Datos informativos clave para el finiquito
                antiguedadAnios: detallesCalculo?.antiguedadAnios || 0,
                sdiIntegrado: detallesCalculo?.sdiIntegrado || 0,
                baseGravableOrdinaria: detallesCalculo?.baseGravableOrdinaria || 0,
                baseGravableSeparacion: detallesCalculo?.baseGravableSeparacion || 0
            },
            percepciones: percepciones || [],
            deducciones: deducciones || []
        };

        res.status(200).json(respuestaFiniquito);

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al estructurar el finiquito" });
    }
};

module.exports = {
    calcularPercepciones,
    calcularDeducciones,
    calcularNomina,
    calcularFiniquito
};

