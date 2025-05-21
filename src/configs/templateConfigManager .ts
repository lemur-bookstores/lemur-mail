import path from 'path';
import { findUp } from '../helpers';


export class TemplateConfigManager {
    private static _templatesBasePath: string | null = null;
    private static _isInitialized: boolean = false;

    /**
     * Configura la ruta base para las plantillas de correo.
     * Esta función debe llamarse al inicio de tu aplicación para establecer dónde buscar las plantillas.
     *
     * @param {string | { develop: string; production: string }} config - La ruta (string)
     * o un objeto con rutas específicas para entornos de desarrollo y producción.
     * Se espera que esta ruta sea la *carpeta que contiene* tus archivos `.mustache`.
     */
    static setPath(config: string | { develop: string; production: string }): void {
        if (TemplateConfigManager._isInitialized) {
            console.warn("TemplateConfigManager ya ha sido inicializado. La nueva configuración podría sobrescribir la anterior.");
            // TODO: Considerar si lanzar un error aquí para forzar una inicialización única estricta.
        }

        if (typeof config === 'string') {
            // Asegura que la ruta sea absoluta para evitar problemas de resolución.
            TemplateConfigManager._templatesBasePath = path.resolve(config);
        } else {
            // Decide la ruta basándose en la variable de entorno NODE_ENV.
            const env = process.env.NODE_ENV || 'development';
            TemplateConfigManager._templatesBasePath = path.resolve(env === 'production' ? config.production : config.develop);
        }

        if (!TemplateConfigManager._templatesBasePath) {
            throw new Error("La ruta base de las plantillas no pudo ser determinada. Asegúrate de proporcionar una configuración válida.");
        }

        TemplateConfigManager._isInitialized = true;
    }

    /**
     * Intenta detectar automáticamente la ruta de las plantillas
     * buscando un archivo `lemur-mail.config.js` en la jerarquía de directorios,
     * subiendo desde el directorio de trabajo actual.
     * El archivo de configuración encontrado debe exportar un objeto con una propiedad `path`.
     *
     * Ejemplo de `lemur-mail.config.js`:
     * ```javascript
     * // lemur-mail.config.js
     * const path = require('path');
     * module.exports = {
     * path: path.resolve(__dirname, 'src', 'my-email-templates')
     * }
     * ```
     *
     * @returns {Promise<void>} Una promesa que se resuelve cuando la ruta ha sido detectada y configurada.
     * @throws {Error} Si no se encuentra el archivo de configuración o si la ruta exportada no es válida.
     */
    static async autoDetectPath(): Promise<void> {
        if (TemplateConfigManager._isInitialized) {
            console.warn("TemplateConfigManager ya ha sido inicializado. La nueva configuración podría sobrescribir la anterior.");
        }

        try {
            // Busca el archivo de configuración hacia arriba en el árbol de directorios.
            const configFilePath = await findUp('lemur-mail.config.js');

            if (!configFilePath) {
                throw new Error("No se encontró el archivo 'lemur-mail.config.js' en la jerarquía de directorios. Por favor, asegúrate de que existe o configura la ruta manualmente.");
            }

            // Carga el contenido del archivo de configuración.
            // Se usa 'require' asumiendo que los archivos de configuración son CommonJS.
            // TODO: Si la librería planea ser puramente ES Modules, evaluar si es necesario
            // manejar 'import()' dinámico aquí y sus implicaciones.
            const configModule = require(configFilePath);
            const templatesPathFromConfig = configModule.path;

            if (typeof templatesPathFromConfig !== 'string' || !templatesPathFromConfig) {
                throw new Error(`El archivo 'lemur-mail.config.js' en '${configFilePath}' no exporta una propiedad 'path' válida de tipo string.`);
            }

            // Almacena la ruta resuelta.
            TemplateConfigManager._templatesBasePath = path.resolve(templatesPathFromConfig);
            TemplateConfigManager._isInitialized = true;

        } catch (error: any) {
            // Asegura que el estado de inicialización sea falso si ocurre un error.
            TemplateConfigManager._isInitialized = false;
            throw new Error(`Error al detectar automáticamente la ruta de las plantillas: ${error.message || error}. Considera configurar la ruta manualmente.`);
        }
    }

    /**
     * Obtiene la ruta base de las plantillas que ha sido configurada.
     *
     * @returns {string} La ruta base absoluta de las plantillas.
     * @throws {Error} Si `TemplateConfigManager` no ha sido inicializado previamente
     * (es decir, si no se ha llamado a `setPath()` o `autoDetectPath()`).
     */
    static getPath(): string {
        if (!TemplateConfigManager._isInitialized || !TemplateConfigManager._templatesBasePath) {
            throw new Error("TemplateConfigManager no ha sido inicializado. Por favor, llama a TemplateConfigManager.setPath() o TemplateConfigManager.autoDetectPath() primero.");
        }
        return TemplateConfigManager._templatesBasePath;
    }
}