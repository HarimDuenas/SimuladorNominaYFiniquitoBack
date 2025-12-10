const express = require("express");
const router = express.Router();

// Importamos las funciones del controlador 
const calculosController = require("../controllers/calculos.controller");

// Importamos el middleware (Asegúrate de que exportes estos nombres en tu archivo middleware)
const validarMiddleware = require("../middleware/validar.middleware");

// Ruta 1: Calcular Percepciones 
router.post("/calcular-percepciones", validarMiddleware.validarPercepciones, calculosController.calcularPercepciones); 

/*
    const procesarPercepciones = async () => {
        // Obtener tipo de documento 
        const tipoDocumento = sessionStorage.getItem("documento"); 

        // Validacion por si acaso
        if (!tipoDocumento) {
            alert("Error: No se ha seleccionado el tipo de documento.");
            return false; 
        }

        // Obtener datos del Formulario
        const datosFormulario = obtenerDatosDelFormulario('percepciones'); 

        if (!datosFormulario) {
            alert("Error: No se encontraron los datos necesarios.");
            return false;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/calcular-percepciones?tipo=${tipoDocumento}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosFormulario)
            });

            if (!response.ok) throw new Error("Error en la API de Percepciones");

            const data = await response.json();

            // Guardar en SessionStorage
            sessionStorage.setItem("resultado_percepciones", JSON.stringify(data));
            
            console.log("Paso 1 completado. Datos guardados en sesión.");
            return true; 

        } catch (error) {
            console.error(error);
            return false;
        }
    };
*/

// Ruta 2: Calcular Deducciones (Recibe datos ya procesados, validación ligera opcional)
router.post("/calcular-deducciones", validarMiddleware.validarDeducciones, calculosController.calcularDeducciones);

/*
    const procesarDeducciones = async () => {
        const tipoDocumento = sessionStorage.getItem("documento");


        //Obtener datos del formulario
        const datosFormulario = obtenerDatosDelFormulario('deducciones');

        if (!datosFormulario) {
            alert("Error: No se encontraron los datos necesarios.");
            return false;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/calcular-deducciones?tipo=${tipoDocumento}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyDeducciones)
            });

            if (!response.ok) throw new Error("Error en la API de Deducciones");

            const data = await response.json();

            // Guardar en SessionStorage
            sessionStorage.setItem("resultado_deducciones", JSON.stringify(data));
            
            console.log("Paso 2 completado. Datos guardados en sesión.");
            return true;

        } catch (error) {
            console.error(error);
            return false;
        }
    };
*/

// Ruta 3: Estructurar Nómina Final
router.post('/calcular-nomina', calculosController.calcularNomina);

/*
    const finalizarNomina = async () => {
        // CAMBIO: Leemos de sessionStorage
        const percepcionesData = JSON.parse(sessionStorage.getItem("resultado_percepciones"));
        const deduccionesData = JSON.parse(sessionStorage.getItem("resultado_deducciones"));

        const bodyFinal = {
            totalPercepciones: percepcionesData.totalPercepciones,
            totalDeducciones: deduccionesData.totalDeducciones,
            percepciones: percepcionesData.percepciones,
            deducciones: deduccionesData.deducciones,
            detallesCalculo: { ...percepcionesData.detallesCalculo, ...deduccionesData.detallesCalculo }
        };

        try {
            const response = await fetch('http://localhost:3000/api/calcular-nomina', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyFinal)
            });
            const resultado = await response.json();
            
            console.log("NÓMINA FINAL:", resultado);
            return resultado; // Retornamos para poder pintar en el UI
        } catch (e) { console.error(e); }
    };
*/

// Ruta 4: Estructurar Finiquito Final (CORREGIDO: Ruta única)
router.post('/calcular-finiquito', calculosController.calcularFiniquito);

/*
    const finalizarFiniquito = async () => {
        const percepcionesData = JSON.parse(sessionStorage.getItem("resultado_percepciones"));
        const deduccionesData = JSON.parse(sessionStorage.getItem("resultado_deducciones"));

        const bodyFinal = {
            totalPercepciones: percepcionesData.totalPercepciones,
            totalDeducciones: deduccionesData.totalDeducciones,
            percepciones: percepcionesData.percepciones,
            deducciones: deduccionesData.deducciones,
            detallesCalculo: { ...percepcionesData.detallesCalculo, ...deduccionesData.detallesCalculo }
        };

        try {
            const response = await fetch('http://localhost:3000/api/calcular-finiquito', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyFinal)
            });
            const resultado = await response.json();
            
            console.log("FINIQUITO FINAL:", resultado);
            return resultado;
        } catch (e) { console.error(e); }
    };
*/

/*
        FUNCION DEL BOTON PARA CALCULO FINAL
        
const handleBotonCalcular = async () => {
    // 1. Limpieza de seguridad (Solo borramos los resultados, no el tipo de documento)
    sessionStorage.removeItem("resultado_percepciones");
    sessionStorage.removeItem("resultado_deducciones");

    // 2. Ejecutar Paso 1
    const exitoPaso1 = await procesarPercepciones();
    if (!exitoPaso1) return; 

    // 3. Ejecutar Paso 2
    const exitoPaso2 = await procesarDeducciones();
    if (!exitoPaso2) return; 

    // 4. Ejecutar Paso 3 (Final)
    const tipoDocumento = sessionStorage.getItem("documento");
    let resultadoFinal = null;

    if (tipoDocumento === 'nomina') {
        resultadoFinal = await finalizarNomina();
    } else if (tipoDocumento === 'finiquito') {
        resultadoFinal = await finalizarFiniquito();
    }

    if (resultadoFinal) {
        alert(`Cálculo Exitoso. Neto a Pagar: $${resultadoFinal.netoPagar}`);
        // Aquí llamarías a tu función para pintar la tabla de resultados
        // mostrarResultadosEnTabla(resultadoFinal);
    }
};
*/


module.exports = router;


/*
        FUNCION PARA OBTENER LOS DATOS MAS FACILMENTE

    const obtenerDatosParaPeticion = (etapa) => {
        // Obtener el tipo de documento del storage (previamente guardado al iniciar)
        const tipoDocumento = sessionStorage.getItem("documento"); // 'nomina' o 'finiquito'

        if (!tipoDocumento) {
            console.error("No se ha definido el tipo de documento.");
            return null;
        }

        // Objeto base que llenaremos
        let payload = {};

        //          ESTAS FUNCIONES HACEN EL getElementById POR USTEDES

        //Helper para obtener valor numérico de un input
        const getNum = (id) => Number(document.getElementById(id)?.value) || 0;
        //Helper para obtener texto
        const getTxt = (id) => document.getElementById(id)?.value || "";
        //Helper para obtener boolean (checkbox)
        const getBool = (id) => document.getElementById(id)?.checked || false;


        // =========================================================
        // PARTE A: RECOLECCIÓN DE DATOS DEL HTML (FORMULARIO)
        // =========================================================
        
        // --- DATOS COMUNES (Salario, Fechas) ---
        // Estos se envían en ambas etapas y en ambos tipos de documento
        // Nota: Asume que tienes inputs con estos IDs en tu HTML
        payload.salarioDiario = getNum('inputSalarioDiario');
        payload.fechaIngreso = getTxt('inputFechaIngreso');

        if (tipoDocumento === 'nomina') {
            // --- DATOS EXCLUSIVOS DE NÓMINA ---
            payload.diasPeriodo = getNum('inputDiasPeriodo'); // ESTE SE TIENE QUE CAMBIAR PARA LO DE CONSIDERAR
            payload.diasTrabajados = getNum('inputDiasTrabajados');
            payload.faltas = getNum('inputFaltas');
            payload.horasExtraDobles = getNum('inputHorasDobles');
            payload.horasExtraTriples = getNum('inputHorasTriples');
            payload.primaDominical = getBool('checkPrimaDominical'); // Checkbox

            // Recolectar Array de Otros Bonos (Función auxiliar definida abajo)
            if (etapa === 'percepciones') {
                payload.otrosBonos = obtenerListaDinamica('contenedorBonos', 'percepcion'); 
            }

        } else {
            // --- DATOS EXCLUSIVOS DE FINIQUITO ---
            payload.fechaSalida = getTxt('inputFechaSalida');
            payload.motivoBaja = getTxt('selectMotivoBaja'); // Select: "renuncia_voluntaria", etc.
            payload.diasVacacionesPendientes = getNum('inputVacacionesPendientes');
            payload.diasSalarioPendientes = getNum('inputSalariosPendientes');

            // Recolectar Array de Otros Bonos para Finiquito (si aplica)
            if (etapa === 'percepciones') {
                payload.otrosBonos = obtenerListaDinamica('contenedorBonos', 'percepcion');
            }
        }

        // Recolectar Array de Adeudos (Solo se necesita enviar al calcular deducciones)
        // Aunque si el back lo pide siempre, puedes dejarlo fuera del if
        if (etapa === 'deducciones') {
            payload.adeudos = obtenerListaDinamica('contenedorAdeudos', 'deduccion');
        }


        // =========================================================
        // PARTE B: INYECCIÓN DE DATOS DEL SESSION STORAGE
        // =========================================================
        
        // Si estamos en la etapa de DEDUCCIONES, necesitamos los cálculos del paso 1
        if (etapa === 'deducciones') {
            
            const resultadosPreviosJSON = sessionStorage.getItem("resultado_percepciones");
            
            if (!resultadosPreviosJSON) {
                alert("Error: Debes calcular las percepciones primero.");
                return null;
            }

            const dataPaso1 = JSON.parse(resultadosPreviosJSON);

            if (tipoDocumento === 'nomina') {
                // Inyectamos las bases gravables calculadas por el backend en el paso 1
                payload.baseGravableISR = dataPaso1.baseGravableISR;
                payload.sbcCalculado = dataPaso1.sbcCalculado;
                payload.totalPercepciones = dataPaso1.totalPercepciones; // Para el neto final

            } else {
                // Datos calculados del finiquito paso 1
                payload.baseGravableOrdinaria = dataPaso1.detallesCalculo.baseGravableOrdinaria;
                payload.baseGravableSeparacion = dataPaso1.detallesCalculo.baseGravableSeparacion;
                payload.totalPercepciones = dataPaso1.totalPercepciones;
            }
        }

        return payload;
    };

    // =========================================================
    // FUNCIÓN AUXILIAR PARA ARRAYS DINÁMICOS (BONOS/ADEUDOS)
    // =========================================================

        Asume que en tu HTML tienes una lista de inputs generados dinámicamente.
        Ejemplo: Un div con id="contenedorBonos" que tiene hijos con clase "fila-bono"
        y dentro inputs con clase "input-nombre" y "input-monto".
    
    const obtenerListaDinamica = (idContenedor, tipoMontoKey) => {
        const lista = [];
        const contenedor = document.getElementById(idContenedor);
        
        if (!contenedor) return []; // Si no existe, regresa array vacío

        // Buscamos todas las filas (suponiendo que usas divs o tr con una clase especifica)
        // Ajusta '.fila-item' a tu clase real en el HTML
        const filas = contenedor.querySelectorAll('.fila-item'); 

        filas.forEach(fila => {
            const nombre = fila.querySelector('.input-nombre')?.value || "";
            const monto = Number(fila.querySelector('.input-monto')?.value) || 0;

            if (monto > 0) {
                // Crea el objeto dinámico: { nombre: "X", percepcion: 100 } o { nombre: "Y", deduccion: 50 }
                let item = { nombre: nombre };
                item[tipoMontoKey] = monto; // Asigna 'percepcion' o 'deduccion' según el parámetro
                lista.push(item);
            }
        });

        return lista;
    };
*/