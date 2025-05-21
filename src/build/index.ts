
import { Address, AmpAttachment, Attachment, ListHeaders } from "nodemailer/lib/mailer";
import { Readable } from "nodemailer/lib/xoauth2";
/**
 * @typedef {object} Address
 * @property {string} name - El nombre asociado a la dirección de correo electrónico (ej. "John Doe").
 * @property {string} address - La dirección de correo electrónico (ej. "john.doe@example.com").
 */
// Nota: La interfaz 'Address' no está definida aquí, así que la asumo como un tipo común.
// Si 'Address' es una interfaz/clase externa, asegúrate de que esté importada o definida en otro lugar.

/**
 * @typedef {object} AmpAttachment
 * // Define las propiedades si tienes una interfaz específica para archivos adjuntos AMP
 * // Por ejemplo:
 * // @property {string} content - El contenido del adjunto AMP.
 * // @property {string} type - El tipo MIME del adjunto (ej., 'text/x-amp-html').
 */
// Nota: 'AmpAttachment' no está definida, se asume que es un tipo externo.

/**
 * @typedef {object} Attachment
 * // Define las propiedades de un adjunto estándar de correo electrónico
 * // Por ejemplo (comunes de Nodemailer):
 * // @property {string} filename - El nombre del archivo.
 * // @property {string | Buffer | Readable} content - El contenido del archivo.
 * // @property {string} [contentType] - El tipo MIME del contenido (ej., 'image/png').
 * // @property {string} [path] - Ruta al archivo si se carga desde el sistema de archivos.
 */
// Nota: 'Attachment' no está definida, se asume que es un tipo externo.

/**
 * @typedef {object} ListHeaders
 * // Define las propiedades de los encabezados de lista, si son relevantes para tu lógica.
 * // Por ejemplo (para listas de correo):
 * // @property {string} [id] - ID de la lista.
 * // @property {string} [help] - URL de ayuda para la lista.
 */
// Nota: 'ListHeaders' no está definida, se asume que es un tipo externo.

/**
 * Define una función genérica para crear una instancia de un transportador de correo.
 * Esta función es fundamental para la inicialización de cualquier proveedor de correo.
 *
 * @template T El tipo de la instancia del transportador (ej., `nodemailer.Transporter`).
 * @template C El tipo del objeto de configuración requerido para crear el transportador.
 * @param {C} config - El objeto de configuración específico para el transportador.
 * @returns {T} La instancia del transportador creada.
 */
type CreateTransport<T, C> = (config: any, defaults?: any) => T;

/**
 * Clase abstracta base para la construcción de proveedores de servicios de correo electrónico.
 * Sirve como un contrato para que todas las implementaciones de proveedores de correo (ej., Nodemailer, Mailgun)
 * sigan una estructura consistente.
 *
 * @template Transporter El tipo de la instancia del transportador de correo (ej., `nodemailer.Transporter`).
 * @template Config El tipo del objeto de configuración que el transportador requiere.
 * @template Options El tipo de las opciones de correo electrónico específicas para este constructor (extiende `MailOptions`).
 */
export abstract class MailBuilder<Transporter, Config, Options> {
    /**
     * La instancia protegida del transportador de correo, creada a partir de la configuración.
     * Esta instancia es utilizada por las clases concretas que extienden `MailBuilder` para enviar correos.
     * @protected
     * @type {Transporter}
     */
    protected transporter: Transporter;

    /**
     * Crea una instancia de `MailBuilder`.
     *
     * @param {Config} config - El objeto de configuración para inicializar el transportador.
     * @param {CreateTransport<Transporter, Config>} createTransport - Una función que toma la configuración
     * y devuelve una instancia del transportador. Esto permite flexibilidad en cómo se crea el transportador.
     */
    constructor(config: Config, createTransport: CreateTransport<Transporter, Config>) {
        this.transporter = createTransport(config);
        // Enlaza el contexto 'this' al método sendMail para asegurar que siempre se refiera a la instancia de la clase,
        // incluso cuando el método es pasado como un callback.
        this.sendMail = this.sendMail.bind(this);
    }

    /**
     * Método abstracto para enviar un correo electrónico.
     * Cada clase que extienda `MailBuilder` debe proporcionar su propia implementación
     * de este método, utilizando el `transporter` interno.
     *
     * @template T El tipo de la respuesta esperada de la operación de envío, debe extender `Response`.
     * @param {Options} options - Las opciones del correo electrónico a enviar (ej., destinatario, asunto, cuerpo HTML/texto).
     * @param {string} templateMain - **Nota:** Este parámetro parece no alinearse con la responsabilidad de la clase `IMailProvider`
     * que solo envía correos ya renderizados. Su uso aquí podría causar confusión o indicar una responsabilidad mixta.
     * Considerar su eliminación o refactorización si la renderización se maneja completamente fuera de esta clase.
     * @returns {Promise<T>} Una promesa que se resuelve con un objeto de respuesta del envío del correo.
     */
    public abstract sendMail<T extends Response>(options: Options, templateMain: string): Promise<T>;
}

/**
 * Define las opciones estándar para un correo electrónico.
 * Estas opciones son comunes a la mayoría de los proveedores de correo y se alinean
 * con las propiedades esperadas por clientes como Nodemailer.
 */
export interface MailOptions {
    /**
     * El destinatario(s) del correo. Puede ser una cadena, un objeto de dirección, o un array de ambos.
     * @type {string | Address | Array<string | Address>}
     */
    to: string | Address | Array<string | Address>;
    /**
     * El remitente del correo. Puede ser una cadena o un objeto de dirección.
     * @type {string | Address}
     */
    from: string | Address;
    /**
     * El asunto del correo. Puede ser `undefined` si no se especifica.
     * @type {string | undefined}
     */
    subject: string | undefined;
    /**
     * El contenido del correo en formato de texto plano.
     * @type {string}
     * @optional
     */
    text?: string;
    /**
     * El contenido AMP (Accelerated Mobile Pages) del correo.
     * Utilizado para correos interactivos y dinámicos en clientes compatibles.
     * @type {string | Buffer | Readable | AmpAttachment | undefined}
     * @optional
     */
    amp?: string | Buffer | Readable | AmpAttachment | undefined;
    /**
     * Un array de objetos que representan los archivos adjuntos del correo.
     * @type {Attachment[]}
     * @optional
     */
    attachments?: Attachment[];
    /**
     * Encabezados relacionados con listas de correo.
     * @type {ListHeaders}
     * @optional
     */
    list?: ListHeaders;
}

/**
 * Define la estructura de la respuesta esperada de una operación de envío de correo.
 * Contiene información clave para identificar el correo enviado.
 */
export interface Response {
    /**
     * El ID único del mensaje asignado por el servidor de correo.
     * @type {string}
     */
    messageId: string;
    /**
     * Una URL opcional para previsualizar el correo de prueba (común en Nodemailer para Ethereal.email).
     * @type {string | false | undefined}
     */
    getTestMessageUrl?: string | false;
}

/**
 * Define la interfaz para los casos de uso de envío de correo.
 * Esta interfaz asegura que cualquier clase que implemente casos de uso de envío
 * tendrá el método `sendMail` con las opciones de correo definidas.
 *
 * @template Options El tipo específico de las opciones de correo, que debe extender `MailOptions`.
 */
export interface MailUseCases<Options extends MailOptions> {
    /**
     * Envía un correo electrónico con las opciones y la plantilla especificadas.
     *
     * @template T El tipo de la respuesta esperada del envío, debe extender `Response`.
     * @param {Options} options - Las opciones del correo electrónico (destinatarios, asunto, etc.).
     * @param {string} templateMain - **Nota:** Al igual que en `MailBuilder`, este parámetro `templateMain`
     * puede ser redundante o confuso si la renderización de la plantilla se gestiona
     * completamente antes de llamar al método `sendMail` del proveedor.
     * @returns {Promise<T>} Una promesa que se resuelve con el objeto de respuesta del envío.
     */
    sendMail<T extends Response>(options: Options, templateMain: string): Promise<T>;
}