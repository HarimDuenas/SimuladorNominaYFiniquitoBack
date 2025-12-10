import metodosCalculos from "../utils/metodosCalculos";

// Funcion para calcular Nomina
const calcularNomina = (req, res) => {

    try {
        const { 
            salarioDiario, fechaIngreso, diasPeriodo, diasTrabajados, faltas,
            horasExtraDobles, horasExtraTriples, primaDominical, otrosBonos 
        } = req.body;

        //              C A L C U L O     D E     V A L O R E S     N E T O S     ( A Q U I     V A N     L A S     P E R C E P C I O N E S )

        // Calculo de valores netos
        const montoSueldo = salarioDiario * diasTrabajados;
        const montoPrimaDominical = primaDominical ? (salarioDiario * 0.25) : 0;
        
        const valorHora = salarioDiario / 8;
        const montoHEDobles = valorHora * 2 * horasExtraDobles;
        const montoHETriples = valorHora * 3 * horasExtraTriples;


        //              C A L C U L O     D E     B A S E     G R A V A D A     Y     E X C E N T A

        // Obtencion de base agravada y base suelta
        const desgloseSueldo = metodosCalculos.desglosarGravadoExento('SUELDO', montoSueldo);
        const desglosePrima = metodosCalculos.desglosarGravadoExento('PRIMA_DOMINICAL', montoPrimaDominical);
        const desgloseHEDobles = metodosCalculos.desglosarGravadoExento('HE_DOBLES', montoHEDobles);
        const desgloseHETriples = metodosCalculos.desglosarGravadoExento('HE_TRIPLES', montoHETriples);
        const desgloseBonos = metodosCalculos.desglosarGravadoExento('BONOS', otrosBonos); //No se si se va a enviar el total del front o el array aun (o si es solo un valor numerico)

        // Sumamos toda la base gravable
        const baseGravableISR = 
            desgloseSueldo.gravado + 
            desglosePrima.gravado + 
            desgloseHEDobles.gravado + 
            desgloseHETriples.gravado + 
            desgloseBonos.gravado;

        const totalPercepciones = 
            montoSueldo + montoPrimaDominical + montoHEDobles + montoHETriples + otrosBonos;


        //              C A L C U L O     D E     D E D U C C I O N E S

        // Calculo del isr
        const isr = metodosCalculos.calcularISR(baseGravableISR, diasPeriodo); 

        // Calculo de sbc para el IMMS
        const sbc = metodosCalculos.calcularSBC(salarioDiario, fechaIngreso);

        const imss = metodosCalculos.calcularIMSS(sbc, diasPeriodo);
        const montoFaltas = salarioDiario * faltas;

        const totalDeducciones = isr + imss + montoFaltas;
        const netoPagar = totalPercepciones - totalDeducciones;

        //              R E S P U E S T A     J S O N
        
        res.status(200).json({
            netoPagar: Number(netoPagar.toFixed(2)),
            totalPercepciones: Number(totalPercepciones.toFixed(2)),
            totalDeducciones: Number(totalDeducciones.toFixed(2)),
            detallesCalculo: {
                sbcCalculado: sbc,
                baseGravableISR: Number(baseGravableISR.toFixed(2)),
                parteExentaTotal: Number((totalPercepciones - baseGravableISR).toFixed(2)),
                imssDeterminado: Number(imss.toFixed(2)),
                isrDeterminado: Number(isr.toFixed(2))
            },
            percepciones: [
                { concepto: `Sueldo (${diasTrabajados} días)`, monto: Number(montoSueldo.toFixed(2)) },
                ...(montoPrimaDominical > 0 ? [{ concepto: "Prima Dominical", monto: Number(montoPrimaDominical.toFixed(2)) }] : []),
                ...(montoHEDobles > 0 ? [{ concepto: "Horas Extra Dobles", monto: Number(montoHEDobles.toFixed(2)) }] : []),
                ...(montoHETriples > 0 ? [{ concepto: "Horas Extra Triples", monto: Number(montoHETriples.toFixed(2)) }] : []),
                ...(otrosBonos > 0 ? [{ concepto: "Otros Bonos", monto: Number(otrosBonos.toFixed(2)) }] : [])
            ],
            deducciones: [
                { concepto: "ISR", monto: Number(isr.toFixed(2)) },
                { concepto: "IMSS", monto: Number(imss.toFixed(2)) },
                ...(montoFaltas > 0 ? [{ concepto: "Faltas", monto: Number(montoFaltas.toFixed(2)) }] : [])
            ]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error interno al calcular nómina" });
    }
};

//Funcion para calcular finiquito
const calcularFiniquito = (req, res) => {
    try {
        const { 
            salarioDiario, fechaIngreso, fechaSalida, motivoBaja,
            diasVacacionesPendientes, diasSalarioPendientes, adeudos 
        } = req.body;

        // CALCULOS DE TIEMPO Y BASES
        const ingreso = new Date(fechaIngreso);
        const salida = new Date(fechaSalida);
        const diferenciaTiempo = salida - ingreso;
        const antiguedadAnios = diferenciaTiempo / (1000 * 60 * 60 * 24 * 365.25);

        // Salario Diario Integrado (SDI) para Indemnizaciones
        const sdi = metodosCalculos.calcularSBC(salarioDiario, fechaIngreso);
        
        // Inicializamos arrays y acumuladores
        let percepciones = [];
        let totalOrdinarioGravado = 0; // Para ISR de sueldos/aguinaldo

        // PAGOS ORDINARIOS (Se pagan SIEMPRE)
        
        // Salarios Pendientes
        const montoSalarios = salarioDiario * diasSalarioPendientes;
        percepciones.push({ concepto: `Salario (${diasSalarioPendientes} días pendientes)`, monto: montoSalarios });
        // Sumamos a la base gravable ordinaria
        totalOrdinarioGravado += metodosCalculos.desglosarGravadoExento('SUELDO', montoSalarios).gravado;

        // Vacaciones Pendientes
        const montoVacaciones = salarioDiario * diasVacacionesPendientes;
        percepciones.push({ concepto: `Vacaciones Pendientes (${diasVacacionesPendientes} días)`, monto: montoVacaciones });
        totalOrdinarioGravado += metodosCalculos.desglosarGravadoExento('SUELDO', montoVacaciones).gravado;

        // Prima Vacacional (25%)
        const montoPrimaVac = montoVacaciones * 0.25;
        percepciones.push({ concepto: "Prima Vacacional (25%)", monto: montoPrimaVac });
        totalOrdinarioGravado += metodosCalculos.desglosarGravadoExento('PRIMA_VACACIONAL', montoPrimaVac).gravado;

        // Aguinaldo Proporcional
        // Calculamos días trabajados en el año de salida
        const inicioAnio = new Date(salida.getFullYear(), 0, 1);
        const fechaConteo = ingreso > inicioAnio ? ingreso : inicioAnio;
        const diasTrabajadosAnio = (salida - fechaConteo) / (1000 * 60 * 60 * 24);
        
        const montoAguinaldo = (diasTrabajadosAnio / 365) * 15 * salarioDiario;
        percepciones.push({ concepto: "Aguinaldo Proporcional", monto: montoAguinaldo });
        totalOrdinarioGravado += metodosCalculos.desglosarGravadoExento('AGUINALDO', montoAguinaldo).gravado;


        // PAGOS POR SEPARACIÓN (Indemnizaciones)
        
        let montoPrimaAntiguedad = 0;
        let montoIndemnizacion3M = 0;
        let montoIndemnizacion20D = 0;

        //      Prima de Antigüedad ---
        // Aplica en: Despidos, Muerte, Invalidez, o Renuncia > 15 años
        let aplicaAntiguedad = false;
        if (["despido_injustificado", "despido_justificado", "incapacidad_permanente", "defuncion"].includes(motivoBaja)) {
            aplicaAntiguedad = true;
        } else if (motivoBaja === "renuncia_voluntaria" && antiguedadAnios >= 15) {
            aplicaAntiguedad = true;
        }

        if (aplicaAntiguedad) {
            const dobleUMA = 2 * metodosCalculos.UMA;
            const salarioBaseAntiguedad = salarioDiario > dobleUMA ? dobleUMA : salarioDiario;
            montoPrimaAntiguedad = 12 * antiguedadAnios * salarioBaseAntiguedad;
            
            percepciones.push({ concepto: "Prima de Antigüedad", monto: montoPrimaAntiguedad });
        }

        //      Indemnización Constitucional ---
        // Aplica en: Solo Despido Injustificado
        if (motivoBaja === "despido_injustificado") {
            montoIndemnizacion3M = 90 * sdi; // 3 Meses
            montoIndemnizacion20D = 20 * antiguedadAnios * sdi; // 20 días/año
            
            percepciones.push({ concepto: "Indemnización (3 meses)", monto: montoIndemnizacion3M });
            percepciones.push({ concepto: "Indemnización (20 días/año)", monto: montoIndemnizacion20D });
        }

        // CÁLCULO DE IMPUESTOS (ISR)

        // ISR Ordinario (Sobre sueldos, vacaciones, aguinaldo)
        // Usamos tabla mensual (30 días)
        const isrOrdinario = metodosCalculos.calcularISR(totalOrdinarioGravado, 30);

        // ISR Liquidación (Sobre indemnizaciones y antigüedad)
        let isrLiquidacion = 0;
        const totalSeparacion = montoPrimaAntiguedad + montoIndemnizacion3M + montoIndemnizacion20D;

        if (totalSeparacion > 0) {
            // Usamos el método que incluye la exención de 90 UMAs por año
            const desgloseSeparacion = metodosCalculos.desglosarGravadoExento(
                'PAGOS_SEPARACION', 
                totalSeparacion, 
                antiguedadAnios
            );

            if (desgloseSeparacion.gravado > 0) {
                isrLiquidacion = metodosCalculos.calcularISR(desgloseSeparacion.gravado, 30);
            }
        }

        const totalISR = isrOrdinario + isrLiquidacion;

        // TOTALES Y DEDUCCIONES
        
        const totalPercepciones = percepciones.reduce((sum, item) => sum + item.monto, 0);
        
        let deducciones = [
            { concepto: "ISR (Total)", monto: totalISR }
        ];
        
        if (adeudos > 0) {
            deducciones.push({ concepto: "Adeudos", monto: adeudos });
        }

        const totalDeducciones = deducciones.reduce((sum, item) => sum + item.monto, 0);

        // RESPUESTA AL CLIENTE
        res.status(200).json({
            netoPagar: Number((totalPercepciones - totalDeducciones).toFixed(2)),
            totalPercepciones: Number(totalPercepciones.toFixed(2)),
            totalDeducciones: Number(totalDeducciones.toFixed(2)),
            detallesCalculo: {
                antiguedadAnios: Number(antiguedadAnios.toFixed(2)),
                sdiIntegrado: Number(sdi.toFixed(2)),
                isrOrdinario: Number(isrOrdinario.toFixed(2)),
                isrLiquidacion: Number(isrLiquidacion.toFixed(2))
            },
            percepciones: percepciones.map(p => ({ ...p, monto: Number(p.monto.toFixed(2)) })),
            deducciones: deducciones.map(d => ({ ...d, monto: Number(d.monto.toFixed(2)) }))
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al calcular finiquito" });
    }
};

module.exports = {
    calcularNomina,
    calcularFiniquito
};

