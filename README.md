# Simulador de Nómina y Finiquitos - Backend API

API REST desarrollada en Node.js encargada de realizar la lógica de negocio, cálculos de impuestos (ISR, IMSS) y generación de documentos (PDF y Excel) para el sistema de simulador de nóminas.

## 🚀 Tecnologías Utilizadas

* **Node.js**: Entorno de ejecución para JavaScript.
* **Express**: Framework para el servidor web y manejo de rutas.
* **Puppeteer**: Librería para la generación de recibos en PDF (Headless Chrome).
* **ExcelJS**: Librería para la creación de hojas de cálculo (.xlsx).
* **CORS**: Middleware para permitir peticiones desde el cliente web.

## 📋 Prerrequisitos

* [Node.js](https://nodejs.org/) (v14 o superior recomendado)
* NPM (Incluido con Node.js)

## 🛠️ Instalación y Configuración

1.  **Clonar el repositorio:**
    ```bash
    git clone <URL_TU_REPO_BACKEND>
    cd SimuladorNominaYFiniquitoBack
    ```

2.  **Instalar dependencias:**
    Ejecuta el siguiente comando para instalar las librerías necesarias listadas en `package.json`:
    ```bash
    npm install
    ```
    > *Nota: La instalación de Puppeteer descarga una versión local de Chromium, por lo que puede tardar unos minutos.*

3.  **Configuración del Puerto:**
    Por defecto, el servidor corre en el puerto `3000`. Puedes verificarlo en `index.js`.

## ▶️ Ejecución

Para iniciar el servidor:

```bash
node index.js
```

El servidor iniciará en: `http://localhost:3000`

## 🔗 Endpoints Principales

La API expone sus servicios bajo el prefijo `/api`:

### Cálculos
* `POST /api/calcular-percepciones`: Calcula bases gravables y exentas.
* `POST /api/calcular-deducciones`: Calcula ISR e IMSS basándose en el ingreso gravable.
* `POST /api/calcular-nomina`: Estructura el JSON final para nómina ordinaria.
* `POST /api/calcular-finiquito`: Estructura el JSON final para liquidación.

### Documentos
* `POST /api/generar-pdf`: Genera y descarga el recibo en PDF.
* `POST /api/generar-excel`: Genera y descarga el reporte en Excel.

## 📂 Estructura del Proyecto

```text
├── controllers/    # Lógica de orquestación (Calculos y Documentos)
├── middleware/     # Validaciones de datos de entrada
├── model/          # Tablas de ISR y constantes
├── routes/         # Definición de rutas (Endpoints)
├── utils/          # Métodos matemáticos y Templates (PDF/Excel)
└── index.js        # Punto de entrada y configuración del servidor
```