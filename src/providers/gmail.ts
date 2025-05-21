import nodemailer, { Transporter } from "nodemailer";
import { MailBuilder } from "../build";
import { EmailOptions, MailUseCases, Response } from "../build/useCases";

export interface Config {
    auth: {
        user: string,
        pass: string
    }
}

export class Gmail extends MailBuilder<Transporter, Config & { service: string }, EmailOptions> implements MailUseCases<EmailOptions> {

    constructor(smtpConfig: Config) {
        super({ ...smtpConfig, service: 'Gmail' }, nodemailer.createTransport);
    }

    async sendMail<T extends Response>(options: EmailOptions, templateMain: string): Promise<T> {
        try {
            return await this.transporter.sendMail({
                ...options,
                html: templateMain
            });
        } catch (error: any) {
            console.error("Error sending email:", error?.message | error);
            throw error;
        }
    }

}
