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

// Funcion para calcular Finiquito
const calcularFiniquito = (req, res) =>{

};

// Exportamos las funciones
module.exports = {
    calcularNomina,
    calcularFiniquito
};

