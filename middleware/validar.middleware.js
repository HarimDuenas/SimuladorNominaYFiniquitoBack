//Funcion para validar los datos minimos para calcular nomina
const validarNomina = (req, res, next) => {

    // Si todo sale bien pasamos al controlador
    next();
};

// Funcion para validar los datos minimos para calcular el finiquito
const validarFiniquito = (req, res, next) => {

    // Si todo sale bien pasamos al controlador
    next();
};

module.exports = {
    validarNomina,
    validarFiniquito
};