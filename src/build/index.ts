import { Response } from "./useCases";

type CreateTransport<T> = (config: any) => T;

export abstract class MailBuilder<Transporter, Config, Options> {
    protected transporter: Transporter;

    constructor(config: Config, createTransport: CreateTransport<Transporter>) {
        this.transporter = createTransport(config);
        this.sendMail = this.sendMail.bind(this);
    }

    public abstract sendMail<T extends Response>(options: Options, templateMain: string): Promise<T>;
}