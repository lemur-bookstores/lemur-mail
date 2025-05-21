import { MailOptions, MailBuilder } from './build';
import { RenderedContent, RenderManager } from './renderManager';

// Define el tipo 'Configurations' para hacer el tipado más claro y reutilizable.
type Configurations = LemurMailConfig['provider']['config'];

/**
 * Gestiona el proceso de renderización de plantillas y el envío de correos.
 * Esta clase encapsula la lógica para tomar una plantilla, rellenarla con datos,
 * y luego enviar el correo a través del proveedor de correo configurado.
 *
 * @template Config - El tipo de configuración específica del proveedor de correo,
 * asegurando un tipado estricto para las credenciales del proveedor.
 */
export class TemplateMailer<Config extends Configurations> {
    private templateName: string;
    private mailProvider: MailBuilder<any, Config, MailOptions>;
    private templatesBasePath: string;
    private regex: RegExp | undefined = undefined;

    /**
     * Crea una instancia de `TemplateMailer`.
     *
     * @param {string} templateName - El nombre de la plantilla a utilizar (sin extensión de archivo).
     * @param {MailBuilder<any, Config, MailOptions>} mailProvider - La instancia del proveedor de correo
     * responsable de enviar el email.
     * @param {string} templatesBasePath - La ruta base donde se encuentran los archivos de plantilla.
     * @param {RegExp} [regex] - Una expresión regular opcional para pre-procesar el contenido de la plantilla
     * (ej., para extraer el cuerpo HTML).
     */
    constructor(
        templateName: string,
        mailProvider: MailBuilder<any, Config, MailOptions>,
        templatesBasePath: string,
        regex?: RegExp
    ) {
        this.templateName = templateName;
        this.mailProvider = mailProvider;
        this.templatesBasePath = templatesBasePath;
        this.regex = regex;
    }

    /**
     * Renderiza la plantilla especificada con los datos proporcionados y envía el correo electrónico.
     *
     * @template T - El tipo de los datos que se utilizarán para rellenar los marcadores de posición en la plantilla.
     * @param {Omit<MailOptions, 'text'>} mailOptions - Opciones básicas del correo electrónico como 'to', 'from', 'subject'.
     * Las propiedades `html` y `text` se generarán a partir de la plantilla.
     * @param {T} templateData - Los datos a inyectar en la plantilla para su renderización.
     * @returns {Promise<void>} Una promesa que se resuelve cuando el correo ha sido enviado exitosamente.
     * @throws {Error} Si el proveedor de correo o la ruta base de las plantillas no están configurados.
     */
    public async send<T>(
        mailOptions: Omit<MailOptions, 'text'>,
        templateData: T,
    ): Promise<void> {
        if (!this.mailProvider) {
            throw new Error('El proveedor de correo no está configurado. La instancia de LemurMail podría no estar completamente inicializada.');
        }
        if (!this.templatesBasePath) {
            throw new Error('La ruta base de las plantillas no está configurada. La instancia de LemurMail podría no estar completamente inicializada.');
        }

        // 1. Renderiza la plantilla usando el RenderManager.
        const renderedContent: RenderedContent = await RenderManager.render(
            this.templatesBasePath,
            this.templateName,
            templateData,
            this.regex
        );

        // 2. Compone las opciones finales del correo, incluyendo el contenido renderizado.
        const finalMailOptions: MailOptions = {
            ...mailOptions,
            // Proporciona una cadena vacía como fallback si RenderManager no genera contenido de texto.
            text: renderedContent.text || ''
        };

        // 3. Envía el correo utilizando el proveedor de correo configurado.
        // Se pasa `renderedContent.html` como `templateMain` al método `sendMail` del proveedor.
        // TODO: Evaluar si el método `sendMail` de `MailBuilder` y sus implementaciones
        // realmente necesitan el parámetro `templateMain` si el HTML ya se está pasando
        // dentro de `finalMailOptions.html`. Podría simplificarse a solo `sendMail(finalMailOptions)`.
        await this.mailProvider.sendMail(finalMailOptions, renderedContent.html);
    }
}