declare type NotificationProviders = 'gmail' | 'mailgun' | 'smtp';

declare type LemurMailGmail = {
    auth: {
        user: string,
        pass: string
    }
} | {
    auth: {
        type: 'OAuth2',
        user: string,
        clientId: string,
        clientSecret: string,
        refreshToken: string,
    }
}

declare type LemurMailMailgun = {
    auth: {
        api_key: string,
        domain: string,
        url: string | "https://api.mailgun.net/v3/"
    }
}

declare type LemurMailSmtp = {
    host: string;
    port: number;
    secure: boolean;
    auth: {
        user: string;
        pass: string;
    };
}

declare interface ConfigLemurMailGmailProvider {
    name: 'gmail';
    config: LemurMailGmail;
}

declare interface ConfigLemurMailMailgunProvider {
    name: 'mailgun';
    config: LemurMailMailgun;
}

declare interface ConfigLemurMailSmtpProvider {
    name: 'smtp';
    config: LemurMailSmtp;
}

declare interface IMailProvider {
    sendMail<T extends Response>(options: MailOptions, templateMain: string): Promise<T>;
}

declare interface LemurMailConfig {
    path?: string | { develop: string; production: string; }; // Optional: template path, for manual or auto-detection
    provider: ConfigLemurMailGmailProvider | ConfigLemurMailMailgunProvider | ConfigLemurMailSmtpProvider; // The mail provider configuration
}

// src/interfaces/template.ts (Or wherever you define your template data interface)
declare interface TemplateData {
    [key: string]: any;
}