import nodemailer, { Transporter } from "nodemailer";
import mailgun from 'nodemailer-mailgun-transport';
import { MailBuilder } from "../build";
import { EmailOptions, MailUseCases, Response } from "../build/useCases";

export interface Config {
    auth: {
        api_key: string,
        domain: string,
        url: string | "https://api.mailgun.net/v3/"
    }
}

export class MailGun extends MailBuilder<Transporter, Config, EmailOptions> implements MailUseCases<EmailOptions> {

    constructor(smtpConfig: Config) {
        super(smtpConfig, (op: any) => nodemailer.createTransport(mailgun(op)));
    }

    async sendMail<T extends Response>(options: EmailOptions, templateMain: string): Promise<T> {
        try {

            return await new Promise((resolve, reject) => {
                this.transporter.sendMail({
                    ...options,
                    html: templateMain
                }, (error, data) => {
                    if (error) reject(error);
                    resolve({
                        ...data,
                        getTestMessageUrl: nodemailer.getTestMessageUrl(data)
                    });
                });
            })
        } catch (error) {
            console.error("Error sending email:", error);
            throw error;
        }
    }

}


