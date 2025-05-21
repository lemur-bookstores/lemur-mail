import fs from 'fs/promises';
import mustache from 'mustache';
import path from 'path';
import { Providers } from "./providers";
import { MailBuilder, MailOptions, Response } from "./build";
import { TemplateConfigManager } from './configs/templateConfigManager ';

/**
 * Interfaz para la función de renderizado de plantillas.
 */
interface Render {
    /**
     * Renderiza una plantilla con los datos proporcionados.
     *
     * @template T - El tipo de los datos a inyectar en la plantilla.
     * @param {T} data - Los datos que se usarán para rellenar los marcadores de posición en la plantilla.
     * @param {RegExp} [regex] - Una expresión regular opcional para pre-procesar el contenido de la plantilla
     * (ej., para extraer el cuerpo HTML con `/<body[^>]*>([\s\S]*?)<\/body>/`).
     * @returns {Promise<string>} Una promesa que se resuelve con el contenido HTML renderizado.
     */
    render: <T>(data: T, regex?: RegExp) => Promise<string>;
}

/**
 * Interfaz para la función de envío de correo.
 */
interface Send {
    /**
     * Envía un correo electrónico utilizando la plantilla renderizada.
     *
     * @template T - El tipo de los datos que se utilizaron para la plantilla.
     * @param {MailOptions} option - Las opciones básicas del correo (destinatario, remitente, asunto).
     * @param {T} data - Los datos originales usados para la plantilla (utilizados internamente por el `build` para renderizar).
     * @returns {Promise<Response>} Una promesa que se resuelve con el objeto de respuesta del envío del correo.
     */
    send: <T>(option: MailOptions, data: T) => Promise<Response>;
}

/**
 * Clase `SendTrigger` para iniciar el proceso de envío de correos.
 * Actúa como un punto de entrada estático para configurar y enviar correos
 * a través de diferentes proveedores y plantillas.
 *
 * @example
 * ```typescript
 * // Ejemplo de uso para enviar un correo Gmail con una plantilla
 * SendTrigger.gmail({
 * auth: {
 * user: 'tu_usuario@gmail.com',
 * pass: 'tu_contraseña_app'
 * }
 * }, 'bienvenida').send({ // 'bienvenida' es el nombre de tu archivo plantilla .mustache
 * to: 'receptor@ejemplo.com',
 * from: 'Mi App <noreply@mi-app.com>',
 * subject: '¡Bienvenido a nuestra plataforma!'
 * }, {
 * userName: 'Alice',
 * loginLink: '[https://mi-app.com/login](https://mi-app.com/login)'
 * });
 * ```
 */
export class SendTrigger {

    /**
     * Prepara el envío de un correo usando el proveedor **Gmail**.
     *
     * @template Templates - El tipo del nombre de la plantilla.
     * @param {LemurMailGmail} config - La configuración específica para el transportador de Gmail.
     * @param {Templates} template - El nombre de la plantilla a utilizar (ej. 'verificacion').
     * @returns {Send} Un objeto con un método `send` para ejecutar el envío.
     */
    static gmail<Templates>(config: LemurMailGmail, template: Templates): Send {
        console.log({ step: "Gmail" }); // Log para seguimiento
        return SendTrigger.build(new Providers.Gmail(config), template);
    }

    /**
     * Prepara el envío de un correo usando el proveedor **Mailgun**.
     *
     * @template Templates - El tipo del nombre de la plantilla.
     * @param {LemurMailMailgun} config - La configuración específica para el transportador de Mailgun.
     * @param {Templates} template - El nombre de la plantilla a utilizar (ej. 'restablecer_contraseña').
     * @returns {Send} Un objeto con un método `send` para ejecutar el envío.
     */
    static mailgun<Templates>(config: LemurMailMailgun, template: Templates): Send {
        console.log({ step: "Mailgun" }); // Log para seguimiento
        return SendTrigger.build(new Providers.MailGun(config), template);
    }

    /**
     * Prepara el envío de un correo usando el proveedor **SMTP** genérico.
     *
     * @template Templates - El tipo del nombre de la plantilla.
     * @param {LemurMailSmtp} config - La configuración específica para el transportador SMTP.
     * @param {Templates} template - El nombre de la plantilla a utilizar (ej. 'notificacion').
     * @returns {Send} Un objeto con un método `send` para ejecutar el envío.
     */
    static smtp<Templates>(config: LemurMailSmtp, template: Templates): Send {
        console.log({ step: "Smtp" }); // Log para seguimiento
        return SendTrigger.build(new Providers.Smtp(config), template);
    }

    /**
     * Carga y prepara una plantilla para su renderización.
     *
     * @template Templates - El tipo del nombre de la plantilla.
     * @param {Templates} templateName - El nombre del archivo de la plantilla (sin extensión, ej. 'mi_plantilla').
     * @returns {Render} Un objeto con un método `render` para generar el HTML de la plantilla.
     */
    static template<Templates>(templateName: Templates): Render {
        // Obtiene la ruta base de las plantillas desde el gestor de configuración.
        const templatesFolderPath = TemplateConfigManager.getPath();
        // Construye la ruta completa al archivo de plantilla .mustache.
        const templatePath = path.join(templatesFolderPath, `${templateName}.mustache`);

        console.log({ step: "Path" }); // Log para seguimiento

        return {
            render: async <T>(data: T, regex?: RegExp): Promise<string> => {
                let template: string = await fs.readFile(templatePath, 'utf8');
                let matches: RegExpMatchArray | null = null;

                // Si se proporciona una expresión regular, intenta extraer contenido específico.
                if (regex && (matches = template.match(regex)) && matches.length > 0) {
                    const [_, content] = matches;
                    template = content.trim(); // Usa la primera captura y elimina espacios en blanco.
                }

                console.log({ step: "template rendered" }); // Log para seguimiento
                return mustache.render(template, data);
            }
        };
    }

    /**
     * Método interno para construir el proceso de envío.
     * Une el proveedor de correo con la funcionalidad de renderización de plantillas.
     *
     * @template Templates - El tipo del nombre de la plantilla.
     * @param {MailBuilder<any, any, any>} provider - La instancia del proveedor de correo (Gmail, Mailgun, Smtp).
     * @param {Templates} template - El nombre de la plantilla a utilizar.
     * @returns {Send} Un objeto con un método `send` que ejecuta el envío final del correo.
     */
    private static build<Templates>(provider: MailBuilder<any, any, any>, template: Templates): Send {
        // Obtiene la función de renderizado para la plantilla específica.
        const { render } = SendTrigger.template(template);

        return {
            send: async function <T>(option: MailOptions, data: T): Promise<Response> {
                // Renderiza la plantilla con los datos proporcionados.
                const renderedTemplate = await render(data);
                console.log({ step: "Send" }); // Log para seguimiento
                // Envía el correo usando el proveedor y la plantilla ya renderizada.
                // TODO: Reevaluar si el método `sendMail` de `MailBuilder` necesita el parámetro `templateMain`
                // dado que el HTML ya está en `option.html` o se pasaría al proveedor directamente.
                // Podría ser más limpio `provider.sendMail({ ...option, html: renderedTemplate })`.
                return await provider.sendMail(option, renderedTemplate);
            }
        };
    }
}