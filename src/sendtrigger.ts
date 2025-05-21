import fs from 'fs/promises';
import mustache from 'mustache';
import path from 'path';
import { MailBuilder, MailOptions, Response } from "./build";
import { Providers } from "./providers";
import { TemplateConfigManager } from './configs/templateConfigManager ';

interface Render {
    /**
     *
     * @param data T
     * @param regex [RegExp] /<body[^>]*>([\s\S]*?)<\/body>/
     * @returns {Promise<string>}
     */
    render: <T>(data: T, regex?: RegExp) => Promise<string>
}

interface Send {
    /**
     * Send template
     * @param option [MailOptions]
     * @param data [T]
     * @returns {Promise<Response>}
     */
    send: <T>(option: MailOptions, data: T) => Promise<Response>
}

/**
 * Send Trigger.
 * @description ````
 * SendTrigger.gmail({
 *  auth: {
 *      user: 'user',
 *      pass: 'password'
 *  }
 * }, 'template').send({
 *  to: 'email',
 *  from: 'text <email>',
 *  subject?: undefined,
 *  text: ''
 * });````
 */

export class SendTrigger {

    /**
     * Gmail Send
     * @param config
     * @param template
     * @returns Promise
     */
    static gmail<Templates>(config: LemurMailGmail, template: Templates) {
        console.log({ step: "Gmail" });
        return SendTrigger.build(new Providers.Gmail(config), template);
    }

    /**
     * Mailgun Send
     * @param config
     * @param template
     * @returns Promise
     */
    static mailgun<Templates>(config: LemurMailMailgun, template: Templates) {
        console.log({ step: "Mailgun" });
        return SendTrigger.build(new Providers.MailGun(config), template);
    }

    /**
     * Smtp Send
     * @param config
     * @param template
     * @returns Promise
     */
    static smtp<Templates>(config: LemurMailSmtp, template: Templates) {
        console.log({ step: "Smtp" });
        return SendTrigger.build(new Providers.Smtp(config), template);
    }

    /**
     * load template name
     * @param templateName [string] Template name
     * @return {Render}
     */
    static template<Templates>(templateName: Templates): Render {
        // Obtiene la ruta de la configuración centralizada
        const templatesFolderPath = TemplateConfigManager.getPath();
        const templatePath = path.join(templatesFolderPath, `${templateName}.mustache`);

        console.log({ step: "Path" });

        return {
            /**
             *
             * @param data T
             * @param regex [RegExp] <body[^>]*>([\s\S]*?)<\/body>/
             * @returns {Promise<string>}
             */
            render: async <T>(data: T, regex?: RegExp): Promise<string> => {
                let template: string = await fs.readFile(templatePath, 'utf8');
                let matchs: RegExpMatchArray | null = null;
                if (regex && Array.isArray(matchs = template.match(regex)) && matchs.length > 0) {
                    const [_, content] = matchs;
                    template = content.trim();
                }
                console.log({ step: "tmeplate" });
                return mustache.render(template, data);
            }
        }
    }

    /**
     * build provider
     * @param provider
     * @param template
     * @returns {Send}
     */
    private static build<Templates>(provider: MailBuilder<any, any, any>, template: Templates): Send {
        const { render } = SendTrigger.template(template);
        return {
            /**
             * Send template
             * @param option [MailOptions]
             * @param data [T]
             * @returns {Promise<Response>}
             */
            send: async function <T>(option: MailOptions, data: T): Promise<Response> {
                const template = await render(data);
                console.log({ step: "Send" });
                return await provider.sendMail(option, template);
            }
        };
    }

}