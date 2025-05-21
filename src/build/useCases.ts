import { Address, AmpAttachment, Attachment, ListHeaders } from "nodemailer/lib/mailer";
import { Readable } from "nodemailer/lib/xoauth2";

export interface EmailOptions {
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

export interface MailUseCases<Options extends EmailOptions> {
    sendMail<T extends Response>(options: Options, templateMain: string): Promise<T>
}