import nodemailer, { Transporter } from "nodemailer";
import mailgun from 'nodemailer-mailgun-transport';
import { MailBuilder } from "../build";
import { MailOptions, MailUseCases, Response } from "../build/useCases";

export class MailGun<Config> extends MailBuilder<Transporter, Config, MailOptions> implements MailUseCases<MailOptions> {

    constructor(smtpConfig: Config) {
        super(smtpConfig, (op: any) => nodemailer.createTransport(mailgun(op)));
    }

    async sendMail<T extends Response>(options: MailOptions, templateMain: string): Promise<T> {
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


