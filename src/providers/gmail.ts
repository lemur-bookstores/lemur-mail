import nodemailer, { Transporter } from "nodemailer";
import { MailBuilder } from "../build";
import { MailOptions, MailUseCases, Response } from "../build/useCases";

export class Gmail<Config> extends MailBuilder<Transporter, Config, MailOptions> implements MailUseCases<MailOptions> {

    constructor(smtpConfig: Config) {
        super({ ...smtpConfig, service: 'Gmail' }, nodemailer.createTransport);
    }

    async sendMail<T extends Response>(options: MailOptions, templateMain: string): Promise<T> {
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
