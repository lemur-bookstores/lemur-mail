import { Gmail } from "./gmail";
import { MailGun } from "./mailGun";
import { Smtp } from "./smtp";

export class Manager {
    /**
     * Devuelve una instancia inicializada del proveedor de correo basada en el nombre y la configuración dados.
     * @param name El nombre del proveedor de correo (ej. 'nodemailer', 'gmail').
     * @param config El objeto de configuración específico para ese proveedor.
     * @returns Una instancia de IMailProvider.
     * @throws Si el nombre del proveedor es desconocido o la configuración es inválida.
     */
    public static getProvider(name: NotificationProviders, config: any) {
        switch (name.toLowerCase()) {
            case 'smt':
                return new Smtp(config);
            case 'gmail':
                return new Gmail(config);
            case 'mailgun':
                return new MailGun(config);
            default:
                throw new Error(`Proveedor de correo desconocido: "${name}". Por favor, verifica el nombre del proveedor o impleméntalo.`);
        }
    }
}