import { Gmail } from "./gmail";
import { MailGun } from "./mailGun";
import { Smtp } from "./smtp";

type Configurations = LemurMailConfig['provider']['config']
/**
 * Clase Gestora (Manager) para la obtención de instancias de proveedores de correo.
 * Actúa como una fábrica, devolviendo la implementación correcta de `IMailProvider`
 * basándose en el nombre del proveedor y su configuración.
 */
export class Manager {
    /**
     * Devuelve una instancia inicializada de un proveedor de correo.
     *
     * @param {NotificationProviders} name - El nombre del proveedor de correo a obtener (ej., 'smt', 'gmail', 'mailgun').
     * @param {any} config - El objeto de configuración específico para el proveedor seleccionado.
     * @returns {Smtp<Configurations> | Gmail<Configurations> | MailGun<Configurations>} Una instancia del proveedor de correo solicitado.
     * @throws {Error} Si el `name` del proveedor es desconocido o no está implementado.
     */
    public static getProvider(name: NotificationProviders, config: Configurations): Smtp<Configurations> | Gmail<Configurations> | MailGun<Configurations> {
        switch (name.toLowerCase()) {
            case 'smt': // Considera cambiar a 'smtp' para consistencia si es para SMTP genérico.
                return new Smtp(config);
            case 'gmail':
                return new Gmail(config);
            case 'mailgun':
                return new MailGun(config);
            // TODO: Añadir aquí más casos para otros proveedores de correo (ej., 'sendgrid', 'ses').
            default:
                throw new Error(`Proveedor de correo desconocido: "${name}". Por favor, verifica el nombre o implementa el proveedor.`);
        }
    }
}