import nodemailer, { Transporter } from "nodemailer";
import { MailBuilder, MailOptions, MailUseCases, Response } from "../build";

/**
 * Clase para el proveedor de correo SMTP genérico.
 * Extiende `MailBuilder` para integrar la funcionalidad de envío de correos
 * a través de un servidor SMTP estándar utilizando Nodemailer.
 *
 * @template Config - El tipo de configuración específica para el transportador SMTP.
 * Debe ser compatible con las opciones de configuración SMTP de Nodemailer.
 */
export class Smtp<Config> extends MailBuilder<Transporter, Config, MailOptions> implements MailUseCases<MailOptions> {

    /**
     * Crea una instancia del proveedor de correo SMTP.
     * Configura el transportador de Nodemailer con las opciones SMTP proporcionadas.
     *
     * @param {Config} smtpConfig - El objeto de configuración SMTP.
     * Típicamente incluye `host`, `port`, `secure`, y `auth` (usuario/contraseña).
     */
    constructor(smtpConfig: Config) {
        // Llama al constructor de la clase base (MailBuilder).
        // Utiliza `nodemailer.createTransport` directamente con la configuración SMTP.
        super(smtpConfig, nodemailer.createTransport);
    }

    /**
     * Envía un correo electrónico utilizando el transportador SMTP configurado.
     *
     * @template T - El tipo de respuesta esperada, que debe extender la interfaz `Response`.
     * @param {MailOptions} options - Las opciones del correo electrónico a enviar (destinatario, asunto, etc.).
     * @param {string} templateMain - El contenido HTML del cuerpo del correo, ya renderizado a partir de una plantilla.
     * @returns {Promise<T>} Una promesa que se resuelve con un objeto de respuesta del envío del correo.
     * @throws {Error} Si ocurre un error durante el proceso de envío del correo.
     */
    async sendMail<T extends Response>(options: MailOptions, templateMain: string): Promise<T> {
        try {
            // Envía el correo usando el transportador interno (Nodemailer).
            // La propiedad 'html' se establece con el contenido de la plantilla ya renderizado.
            const result = await this.transporter.sendMail({
                ...options,
                html: templateMain
            });
            // TODO: Asegurarse de que el 'result' de Nodemailer se mapee correctamente a la interfaz 'Response'.
            // Nodemailer devuelve un objeto con 'messageId', 'response', 'envelope', 'accepted', 'rejected', etc.
            // Es posible que necesites un paso de mapeo explícito aquí para asegurar que 'getTestMessageUrl'
            // y otras propiedades de 'Response' estén presentes o sean 'undefined' o `false` según corresponda.
            return result as T;
        } catch (error: any) {
            console.error("Error al enviar correo:", error?.message || error);
            throw error;
        }
    }
}
