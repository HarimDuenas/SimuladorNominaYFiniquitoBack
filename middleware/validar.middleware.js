//Funcion para validar los datos minimos para calcular nomina
const validarNomina = (req, res, next) => {

    const {
        salarioDiario,
        fechaIngreso,
        diasPeriodo,
        diasTrabajados,
        faltas,
        horasExtraDobles,
        horasExtraTriples,
        primaDominical,
        otrosBonos
    } = req.body;

    // Se agrupan todos los campos que deben de ser de tipo numerico
    const camposNumericos = {
        salarioDiario,
        diasPeriodo,
        diasTrabajados,
        faltas,
        horasExtraDobles,
        horasExtraTriples,
        otrosBonos
    };

    //Variable que guardara registro de los errores en los datos
    const errores = [];

    //Se comprueba que los datos de tipo numerico no sean nulos o de otro tipo
    for (const [key, value] of Object.entries(camposNumericos)) {
        if (value === undefined || typeof value !== 'number') {
            errores.push(`El campo '${key}' es obligatorio y debe ser un número.`);
        }
    }

    // Se valida la primaDominical que ocupa ser de tipo boolean
    if (typeof primaDominical !== 'boolean') {
        errores.push("El campo 'primaDominical' es obligatorio y debe ser true o false.");
    }

    // Se valida que la fecha de ingreso este ingresada con la estructura correcta
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/; //Expresion regular que confirma la estructura de la fecha
    if (!fechaIngreso || !fechaRegex.test(fechaIngreso)) {
        errores.push("El campo 'fechaIngreso' es obligatorio y debe tener el formato YYYY-MM-DD.");
    }

    // Si hay errores, retornamos respuesta 400 antes de pasar al controlador
    if (errores.length > 0) {
        return res.status(400).json({
            mensaje: "Error de validación en datos de nómina",
            detalles: errores
        });
    }

    // Si todo sale bien pasamos al controlador
    next();
};

// Funcion para validar los datos minimos para calcular el finiquito
const validarFiniquito = (req, res, next) => {

    const {
        salarioDiario,
        fechaIngreso,
        fechaSalida,
        motivoBaja,
        diasVacacionesPendientes,
        diasSalarioPendientes,
        adeudos
    } = req.body;

    //Variable que guardara registro de los errores en los datos
    const errores = [];

    // Se agrupan todos los campos que deben de ser de tipo numerico
    const camposNumericos = {
        salarioDiario,
        diasVacacionesPendientes,
        diasSalarioPendientes,
        adeudos
    };

    //Se comprueba que los datos de tipo numerico no sean nulos o de otro tipo
    for (const [key, value] of Object.entries(camposNumericos)) {
        if (value === undefined || typeof value !== 'number') {
            errores.push(`El campo '${key}' es obligatorio y debe ser un número.`);
        }
    }

    //Se comprueba que los datos de tipo fecha esten estructurados correctamente
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/; //Expresion regular que confirma la estructura de la fecha
    if (!fechaIngreso || !fechaRegex.test(fechaIngreso)) {
        errores.push("El campo 'fechaIngreso' es obligatorio y debe tener el formato YYYY-MM-DD.");
    }
    if (!fechaSalida || !fechaRegex.test(fechaSalida)) {
        errores.push("El campo 'fechaSalida' es obligatorio y debe tener el formato YYYY-MM-DD.");
    }

    //Se valida que no haya una incoherencia en las fechas de entrada y de salida
    if (fechaIngreso && fechaSalida && new Date(fechaSalida) < new Date(fechaIngreso)) {
         errores.push("Lógica inválida: La 'fechaSalida' no puede ser anterior a la 'fechaIngreso'.");
    }

    // El PDF especifica valores exactos que determinan el cálculo.
    const motivosValidos = [
        "renuncia_voluntaria",
        "despido_justificado",
        "despido_injustificado",
        "fin_contrato",
        "incapacidad_permanente",
        "defuncion",
        "jubilacion"
    ];

    if (!motivoBaja || !motivosValidos.includes(motivoBaja)) {
        errores.push(`El campo 'motivoBaja' es inválido. Valores permitidos: ${motivosValidos.join(", ")}`);
    }

    // Si hay errores, retornamos respuesta 400
    if (errores.length > 0) {
        return res.status(400).json({
            mensaje: "Error de validación en datos de finiquito",
            detalles: errores
        });
    }

    // Si todo sale bien pasamos al controlador
    next();
};

module.exports = {
    validarNomina,
    validarFiniquito
};

//Nota temporal:

/*
    // Supongamos que esta fecha viene de tu base de datos o de un cálculo
    const fechaObjeto = new Date("2023-01-15T14:30:00.000Z");

    // Opción A: Usar toISOString y cortar la parte de la hora (La más rápida y compatible)
    const fechaFormateada = fechaObjeto.toISOString().split('T')[0]; 
    // Resultado: "2023-01-15"

    // Opción B: Construir el JSON de respuesta
    res.status(200).json({
        mensaje: "Cálculo exitoso",
        datosEmpleado: {
            id: 123,
            // Aquí envías la fecha limpia como string
            fechaIngreso: fechaFormateada, 
            fechaCalculo: new Date().toISOString().split('T')[0] // Fecha de hoy
        },
        // ... resto de la respuesta del PDF
    });
*/