// Expresión regular para validar fechas YYYY-MM-DD
const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;

const validarPercepciones = (req, res, next) => {
    const { tipo } = req.query;
    const errores = [];

    // --- Validar que exista el tipo ---
    if (!tipo || (tipo !== 'nomina' && tipo !== 'finiquito')) {
        return res.status(400).json({ 
            mensaje: "El parámetro 'tipo' es obligatorio y debe ser 'nomina' o 'finiquito'." 
        });
    }

    // NÓMINA (Datos para ingresos ordinarios)
    if (tipo === 'nomina') {
        const { 
            salarioDiario, fechaIngreso, diasTrabajados,
            horasExtraDobles, horasExtraTriples, primaDominical, otrosBonos 
        } = req.body;

        // Campos Numéricos Obligatorios
        const camposNumericos = { 
            salarioDiario, diasTrabajados, horasExtraDobles, horasExtraTriples 
        };

        for (const [key, value] of Object.entries(camposNumericos)) {
            if (value === undefined || typeof value !== 'number') {
                errores.push(`El campo '${key}' es obligatorio y debe ser un número.`);
            }
        }

        // Booleano
        if (typeof primaDominical !== 'boolean') {
            errores.push("El campo 'primaDominical' es obligatorio y debe ser true o false.");
        }

        // Fecha
        if (!fechaIngreso || !fechaRegex.test(fechaIngreso)) {
            errores.push("El campo 'fechaIngreso' debe tener formato YYYY-MM-DD.");
        }

    // FINIQUITO (Datos para liquidación)
    } else {
        const { 
            salarioDiario, fechaIngreso, fechaSalida, motivoBaja,
            diasVacacionesPendientes, diasSalarioPendientes 
        } = req.body;

        // Campos Numéricos
        const camposNumericos = { 
            salarioDiario, diasVacacionesPendientes, diasSalarioPendientes 
        };

        for (const [key, value] of Object.entries(camposNumericos)) {
            if (value === undefined || typeof value !== 'number') {
                errores.push(`El campo '${key}' es obligatorio y debe ser un número.`);
            }
        }

        // Fechas y Lógica
        if (!fechaIngreso || !fechaRegex.test(fechaIngreso)) errores.push("El campo 'fechaIngreso' debe tener formato YYYY-MM-DD.");
        if (!fechaSalida || !fechaRegex.test(fechaSalida)) errores.push("El campo 'fechaSalida' debe tener formato YYYY-MM-DD.");
        
        if (fechaIngreso && fechaSalida && new Date(fechaSalida) < new Date(fechaIngreso)) {
            errores.push("La 'fechaSalida' no puede ser anterior a la 'fechaIngreso'.");
        }

        // Motivo de Baja
        const motivosValidos = [
            "renuncia_voluntaria", "despido_justificado", "despido_injustificado", 
            "fin_contrato", "incapacidad_permanente", "defuncion", "jubilacion"
        ];
        if (!motivoBaja || !motivosValidos.includes(motivoBaja)) {
            errores.push(`El campo 'motivoBaja' es inválido. Permitidos: ${motivosValidos.join(", ")}`);
        }
    }

    // VALIDACIÓN COMÚN: OTROS BONOS (Array)
    if (req.body.otrosBonos !== undefined) {
        if (!Array.isArray(req.body.otrosBonos)) {
            errores.push("El campo 'otrosBonos' debe ser un arreglo de objetos.");
        } else {
            req.body.otrosBonos.forEach((bono, index) => {
                if (typeof bono.percepcion !== 'number') {
                    errores.push(`El bono en la posición ${index} debe tener una propiedad 'percepcion' numérica.`);
                }
            });
        }
    }

    // RESPUESTA DE ERRORES
    if (errores.length > 0) {
        return res.status(400).json({ mensaje: "Error de validación (Percepciones)", detalles: errores });
    }

    next();
};

const validarDeducciones = (req, res, next) => {
    const { tipo } = req.query;
    const errores = [];

    if (!tipo || (tipo !== 'nomina' && tipo !== 'finiquito')) {
        return res.status(400).json({ 
            mensaje: "El parámetro 'tipo' es obligatorio y debe ser 'nomina' o 'finiquito'." 
        });
    }

    // CASO A: NÓMINA
    if (tipo === 'nomina') {
        const { salarioDiario, diasPeriodo, faltas, baseGravableISR, sbcCalculado } = req.body;

        // Validamos datos originales + DATOS CALCULADOS EN EL PASO ANTERIOR
        const camposNumericos = { 
            salarioDiario, diasPeriodo, faltas, baseGravableISR, sbcCalculado 
        };

        for (const [key, value] of Object.entries(camposNumericos)) {
            if (value === undefined || typeof value !== 'number') {
                errores.push(`El campo '${key}' es obligatorio y debe ser un número.`);
            }
        }

    // CASO B: FINIQUITO
    } else {
        const { baseGravableOrdinaria, baseGravableSeparacion } = req.body;

        // Validamos que lleguen las bases gravables del paso anterior
        const camposNumericos = { baseGravableOrdinaria, baseGravableSeparacion };

        for (const [key, value] of Object.entries(camposNumericos)) {
            if (value === undefined || typeof value !== 'number') {
                errores.push(`El campo '${key}' es obligatorio (resultado del cálculo de percepciones).`);
            }
        }
    }

    // VALIDACIÓN COMÚN: ADEUDOS (Array)
    if (req.body.adeudos !== undefined) {
        if (!Array.isArray(req.body.adeudos)) {
            errores.push("El campo 'adeudos' debe ser un arreglo de objetos.");
        } else {
            req.body.adeudos.forEach((adeudo, index) => {
                if (typeof adeudo.deduccion !== 'number') {
                    errores.push(`El adeudo en la posición ${index} debe tener una propiedad 'deduccion' numérica.`);
                }
            });
        }
    }

    // RESPUESTA DE ERRORES
    if (errores.length > 0) {
        return res.status(400).json({ mensaje: "Error de validación (Deducciones)", detalles: errores });
    }

    next();
};

module.exports = {
    validarPercepciones,
    validarDeducciones
};