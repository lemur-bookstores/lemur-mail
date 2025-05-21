
import { Address, AmpAttachment, Attachment, ListHeaders } from "nodemailer/lib/mailer";
import { Readable } from "nodemailer/lib/xoauth2";

type CreateTransport<T, C> = (config: C) => T;

export abstract class MailBuilder<Transporter, Config, Options> {
    protected transporter: Transporter;

    constructor(config: Config, createTransport: CreateTransport<Transporter, Config>) {
        this.transporter = createTransport(config);
        this.sendMail = this.sendMail.bind(this);
    }

    public abstract sendMail<T extends Response>(options: Options, templateMain: string): Promise<T>;
}


export interface MailOptions {
    to: string | Address | Array<string | Address>;
    from: string | Address;
    subject: string | undefined;
    text?: string;
    amp?: string | Buffer | Readable | AmpAttachment | undefined;
    attachments?: Attachment[];
    list?: ListHeaders;
}

export interface Response {
    messageId: string,
    getTestMessageUrl?: string | false
};

export interface MailUseCases<Options extends MailOptions> {
    sendMail<T extends Response>(options: Options, templateMain: string): Promise<T>
}