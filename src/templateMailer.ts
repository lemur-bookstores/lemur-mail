import { MailOptions, MailBuilder } from './build';
import { RenderManager } from './renderManager';

export class TemplateMailer<Config extends LemurMailConfig['provider']['config']> {
    private templateName: string;
    private mailProvider: MailBuilder<any, Config, MailOptions>;
    private templatesBasePath: string;
    private regex: RegExp | undefined = undefined;

    constructor(
        templateName: string,
        mailProvider: MailBuilder<any, Config, MailOptions>,
        templatesBasePath: string,
        regex?: RegExp
    ) {
        this.templateName = templateName;
        this.mailProvider = mailProvider;
        this.templatesBasePath = templatesBasePath;
        this.regex = regex;
    }

    /**
     * Renders the specified template with provided data and sends the email.
     * @param mailOptions Basic email options like 'to', 'from', 'subject'.
     * @param templateData Data used to fill in the template placeholders.
     */
    public async send<T>(
        mailOptions: Omit<MailOptions, 'text'>, // Exclude html/text as they come from the template
        templateData: T,
    ): Promise<void> {
        if (!this.mailProvider) {
            throw new Error('Mail provider is not configured. LemurMail instance might not be fully initialized.');
        }
        if (!this.templatesBasePath) {
            throw new Error('Templates base path is not configured. LemurMail instance might not be fully initialized.');
        }

        // 1. Render the template using RenderManager
        // Assuming RenderManager.render returns an object like { html: '...', text: '...' }
        // Adjust this based on your actual RenderManager's return type.
        const renderedContent = await RenderManager.render(
            this.templatesBasePath,
            this.templateName,
            templateData,
            this.regex
        );

        // 2. Compose the final mail options, including rendered content
        const finalMailOptions: MailOptions = {
            ...mailOptions,
            text: renderedContent.text || '' // Provide a fallback for text if your RenderManager only outputs HTML
        };

        // 3. Send the email using the configured mail provider
        await this.mailProvider.sendMail(finalMailOptions, renderedContent.html);
    }
}