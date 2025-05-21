import path from 'path';
import { findUp } from '../helpers';

export class TemplateConfigManager {
    private static _templatesBasePath: string | null = null;
    private static _isInitialized: boolean = false;

    /**
     * Configura la ruta base para las plantillas de correo.
     * Debe llamarse una única vez al inicio de tu aplicación.
     * @param config La ruta (string) o un objeto con rutas para dev/prod.
     * Se espera que esta ruta sea la *carpeta que contiene* tus archivos .mustache.
     */
    static setPath(config: string | { develop: string; production: string }): void {
        if (TemplateConfigManager._isInitialized) {
            console.warn("TemplateConfigManager ya ha sido inicializado. La nueva configuración podría sobrescribir la anterior.");
            // O podrías lanzar un error si prefieres una inicialización única estricta.
        }

        if (typeof config === 'string') {
            TemplateConfigManager._templatesBasePath = path.resolve(config); // Asegura que sea una ruta absoluta
        } else {
            // Usa NODE_ENV para decidir la ruta
            const env = process.env.NODE_ENV || 'development'; // Default a 'development'
            TemplateConfigManager._templatesBasePath = path.resolve(env === 'production' ? config.production : config.develop);
        }

        if (!TemplateConfigManager._templatesBasePath) {
            throw new Error("La ruta base de las plantillas no pudo ser determinada. Asegúrate de proporcionar una configuración válida.");
        }

        TemplateConfigManager._isInitialized = true;
    }

    /**
     * Intenta detectar automáticamente la ruta de las plantillas
     * buscando un archivo 'lemur-mail.config.js' en la jerarquía de directorios.
     * El archivo de configuración debe exportar un objeto con una propiedad 'path'.
     *
     * Ejemplo de lemur-mail.config.js:
     * ```javascript
     * // lemur-mail.config.js
     * const path = require('path');
     * module.exports = {
     * path: path.resolve(__dirname, 'src', 'my-email-templates')
     * }
     * ```
     *
     * @throws {Error} Si no se encuentra el archivo de configuración o si la ruta no es válida.
     */
    static async autoDetectPath(): Promise<void> {
        if (TemplateConfigManager._isInitialized) {
            console.warn("TemplateConfigManager ya ha sido inicializado. La nueva configuración podría sobrescribir la anterior.");
        }

        try {
            // 1. Buscar el archivo de configuración hacia arriba
            const configFilePath = await findUp('lemur-mail.config.js');

            if (!configFilePath) {
                throw new Error("No se encontró el archivo 'lemur-mail.config.js' en la jerarquía de directorios. Por favor, asegúrate de que existe o configura la ruta manualmente.");
            }

            // 2. Cargar el contenido del archivo de configuración
            // Usamos 'require' porque los archivos de configuración son a menudo CommonJS
            // Si tu proyecto es ES Modules, necesitarías 'import()' dinámico y manejarlo con cuidado.
            const configModule = require(configFilePath);
            const templatesPathFromConfig = configModule.path;

            if (typeof templatesPathFromConfig !== 'string' || !templatesPathFromConfig) {
                throw new Error(`El archivo 'lemur-mail.config.js' en '${configFilePath}' no exporta una propiedad 'path' válida de tipo string.`);
            }

            // 3. Almacenar la ruta resuelta
            // El 'path.resolve' ya debería haberse hecho dentro del archivo de configuración,
            // pero lo volvemos a asegurar por si acaso.
            TemplateConfigManager._templatesBasePath = path.resolve(templatesPathFromConfig);
            TemplateConfigManager._isInitialized = true;

            // console.log(`Ruta de plantillas detectada automáticamente: ${TemplateConfigManager._templatesBasePath}`);

        } catch (error: any) {
            TemplateConfigManager._isInitialized = false; // Asegurarse de que no quede en un estado parcial
            throw new Error(`Error al detectar automáticamente la ruta de las plantillas: ${error.message || error}. Considera configurar la ruta manualmente.`);
        }
    }

    /**
     * Obtiene la ruta base de las plantillas configurada.
     * @returns La ruta base de las plantillas.
     * @throws Error si TemplateConfigManager no ha sido inicializado.
     */
    static getPath(): string {
        if (!TemplateConfigManager._isInitialized || !TemplateConfigManager._templatesBasePath) {
            throw new Error("TemplateConfigManager no ha sido inicializado. Por favor, llama a TemplateConfigManager.setPath() o TemplateConfigManager.autoDetectPath() primero.");
        }
        return TemplateConfigManager._templatesBasePath;
    }
}