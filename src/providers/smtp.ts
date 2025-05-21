import nodemailer, { Transporter } from "nodemailer";
import { MailBuilder } from "../build";
import { EmailOptions, MailUseCases, Response } from "../build/useCases";

export interface Config {
    host: string;
    port: number;
    secure: boolean;
    auth: {
        user: string;
        pass: string;
    };
}

export class Smtp extends MailBuilder<Transporter, Config, EmailOptions> implements MailUseCases<EmailOptions> {

    constructor(smtpConfig: Config) {
        super(smtpConfig, nodemailer.createTransport);
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
