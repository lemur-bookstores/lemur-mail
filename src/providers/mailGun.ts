import nodemailer, { Transporter } from "nodemailer";
import mailgun from 'nodemailer-mailgun-transport';
import { MailBuilder, MailOptions, MailUseCases, Response } from "../build";


/**
 * Clase para el proveedor de correo Mailgun.
 * Extiende `MailBuilder` para integrar la funcionalidad de envío de correos a través de Mailgun,
 * utilizando Nodemailer con el transporte `nodemailer-mailgun-transport`.
 *
 * @template Config - El tipo de configuración específica para el transportador de Mailgun (ej., dominio, clave API).
 * Debe ser compatible con las opciones de configuración de `nodemailer-mailgun-transport`.
 */
export class MailGun<Config> extends MailBuilder<Transporter, Config, MailOptions> implements MailUseCases<MailOptions> {

    /**
     * Crea una instancia del proveedor de correo Mailgun.
     * Configura el transportador de Nodemailer usando el adaptador de Mailgun.
     *
     * @param {Config} smtpConfig - El objeto de configuración para Mailgun.
     * Típicamente incluye `auth: { api_key: string, domain: string }`.
     */
    constructor(smtpConfig: Config) {
        // Llama al constructor de la clase base (MailBuilder).
        // La función `createTransport` interna crea un transportador de Nodemailer
        // utilizando el módulo `nodemailer-mailgun-transport` con la configuración de Mailgun.
        super(smtpConfig, (op: any) => nodemailer.createTransport(mailgun(op)));
    }

    /**
     * Envía un correo electrónico utilizando el transportador de Mailgun configurado.
     *
     * @template T - El tipo de respuesta esperada, que debe extender la interfaz `Response`.
     * @param {MailOptions} options - Las opciones del correo electrónico a enviar (destinatario, asunto, etc.).
     * @param {string} templateMain - El contenido HTML del cuerpo del correo, ya renderizado a partir de una plantilla.
     * @returns {Promise<T>} Una promesa que se resuelve con un objeto de respuesta del envío del correo.
     * @throws {Error} Si ocurre un error durante el proceso de envío del correo.
     */
    async sendMail<T extends Response>(options: MailOptions, templateMain: string): Promise<T> {
        try {
            // Envuelve la llamada a `sendMail` en una Promesa para manejar el callback de Nodemailer.
            return await new Promise((resolve, reject) => {
                this.transporter.sendMail({
                    ...options,
                    html: templateMain // Asigna el HTML renderizado al cuerpo del correo.
                }, (error, data) => {
                    if (error) {
                        return reject(error);
                    }
                    // Mapea la respuesta de Nodemailer/Mailgun a la interfaz `Response`.
                    // Nota: `nodemailer.getTestMessageUrl` es específico de Nodemailer para pruebas,
                    // y podría no ser relevante o devolver `false` para un proveedor real como Mailgun.
                    // TODO: Revisa si el objeto `data` de Mailgun contiene un `messageId` directamente.
                    // Si no, adapta el mapeo para extraerlo del `data` o del `response` de Mailgun.
                    resolve({
                        messageId: data.messageId, // Asume que Mailgun devuelve un messageId.
                        getTestMessageUrl: nodemailer.getTestMessageUrl(data) // Esto es principalmente para pruebas de Nodemailer.
                    } as T); // Casteo forzado a T, asegurar que se alinee con `Response`.
                });
            });
        } catch (error) {
            console.error("Error al enviar correo:", error);
            throw error;
        }
    }
}