import { TemplateConfigManager } from './configs/templateConfigManager '; // Your existing class
import { TemplateMailer } from './templateMailer';
import { MailOptions, MailBuilder } from './build';
import { Manager } from './providers';

/**
 * Clase principal para enviar correos electrónicos con LemurMail.
 * Permite configurar la ruta de las plantillas y el proveedor de correo,
 * ofreciendo una API fluida para el envío de emails basados en plantillas.
 *
 * @template Config - El tipo de configuración específica del proveedor de correo.
 * Esto asegura un tipado estricto para las credenciales del proveedor.
 */
export class LemurMail<Config extends LemurMailConfig['provider']['config']> {
    private templatesBasePath: string | null = null;
    private mailProvider: MailBuilder<any, Config, MailOptions> | null = null;
    private isInitialized: boolean = false;
    private regex: RegExp | undefined = undefined;

    /**
     * Crea una instancia de LemurMail.
     *
     * @param {LemurMailConfig} config - El objeto de configuración que incluye la ruta de las plantillas (opcional)
     * y la configuración del proveedor de correo (requerido).
     * @param {RegExp} [regex] - Una expresión regular opcional para procesar el contenido de la plantilla,
     * @example (`/<body[^>]*>([\s\S]*?)<\/body>/`) // Ejemplo: para extraer el cuerpo de un HTML .
     */
    constructor(config: LemurMailConfig, regex?: RegExp) {
        if (!config || !config.provider || !config.provider.name || !config.provider.config) {
            throw new Error('Configuración inválida. "provider.name" y "provider.config" son requeridos.');
        }

        this.regex = regex;

        try {
            // Inicializa el proveedor de correo de forma síncrona.
            this.mailProvider = Manager.getProvider(
                config.provider.name,
                config.provider.config
            );
        } catch (error: any) {
            throw new Error(`Fallo al inicializar el proveedor de correo "${config.provider.name}": ${error.message}`);
        }

        // Maneja la configuración de la ruta de las plantillas.
        if (config.path) {
            TemplateConfigManager.setPath(config.path);
            this.templatesBasePath = TemplateConfigManager.getPath();
            this.isInitialized = true; // Totalmente inicializado si la ruta es síncrona.
        } else {
            // Si la ruta no se proporciona, intenta auto-detectarla.
            // Nota: autoDetectPath es asíncrono, pero se maneja aquí de forma síncrona,
            // lo que podría llevar a un estado no completamente inicializado si no se llama a `init()`.
            TemplateConfigManager.autoDetectPath();
            this.templatesBasePath = TemplateConfigManager.getPath();
            this.isInitialized = true; // Se marca como inicializado, pero puede que la ruta no esté lista aún.
            console.warn('Ruta de plantillas no proporcionada. Llama a `await lemurMailInstance.init()` para auto-detectar de forma segura.');
            // TODO: Refactorizar: autoDetectPath es asíncrono. Esta sección podría requerir un `await`
            // o que la inicialización completa sea un método `init()` asíncrono obligatorio.
        }
    }

    /**
     * Inicializa asíncronamente la instancia de LemurMail.
     * Este método es crucial si la propiedad `path` no se proporcionó en el constructor
     * y se requiere la auto-detección de la ruta de las plantillas.
     * **Debe ser esperado (`await`) antes de intentar usar `.template().send()`.**
     *
     * @returns {Promise<void>} Una promesa que se resuelve cuando la instancia está completamente inicializada.
     * @throws {Error} Si la ruta de las plantillas no puede ser configurada o auto-detectada.
     */
    public async init(): Promise<void> {
        if (this.isInitialized) {
            console.log('La instancia de LemurMail ya está inicializada.');
            return;
        }

        // Solo intenta auto-detectar si la ruta no se estableció manualmente en el constructor.
        if (!this.templatesBasePath) {
            try {
                await TemplateConfigManager.autoDetectPath();
                this.templatesBasePath = TemplateConfigManager.getPath();
            } catch (error: any) {
                throw new Error(`Fallo al auto-detectar la ruta de las plantillas: ${error.message}. Por favor, proporciona 'path' manualmente o asegúrate de que el archivo de configuración existe.`);
            }
        }

        if (!this.templatesBasePath) {
            throw new Error('La ruta de las plantillas no pudo ser configurada o auto-detectada.');
        }

        this.isInitialized = true;
        console.log('Instancia de LemurMail inicializada correctamente.');
    }

    /**
     * Prepara el envío de un correo electrónico utilizando una plantilla específica.
     *
     * @param {string} templateName - El nombre de la plantilla a utilizar (ej., 'verificacion', 'bienvenida').
     * Debe coincidir con el nombre de tu archivo `.mustache` sin la extensión.
     * @returns {TemplateMailer<Config>} Una instancia de `TemplateMailer`, que permite encadenar el método `send()`.
     * @throws {Error} Si la instancia de LemurMail no está completamente inicializada o si
     * el proveedor de correo/ruta de plantillas no están disponibles.
     */
    public template(templateName: string): TemplateMailer<Config> {
        if (!this.isInitialized) {
            throw new Error('La instancia de LemurMail no está completamente inicializada. Llama a `await init()` primero si la ruta de plantillas necesita auto-detección, o asegúrate de que la ruta se proporcione en el constructor.');
        }
        if (!this.mailProvider) {
            throw new Error('El proveedor de correo no está disponible. Revisa la configuración de LemurMail.');
        }
        if (!this.templatesBasePath) {
            throw new Error('La ruta de las plantillas no está disponible. Revisa la configuración de LemurMail o llama a `init()`.');
        }
        // TODO: Considerar si el 'regex' debería ser una configuración del RenderManager
        // en lugar de pasarlo directamente aquí al TemplateMailer, si RenderManager ya
        // tiene una forma de procesar el contenido HTML.
        return new TemplateMailer(templateName, this.mailProvider, this.templatesBasePath, this.regex);
    }
}