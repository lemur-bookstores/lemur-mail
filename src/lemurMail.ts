import { TemplateConfigManager } from './configs/templateConfigManager '; // Your existing class
import { TemplateMailer } from './templateMailer';
import { MailOptions, MailBuilder } from './build';
import { Manager } from './providers';

export class LemurMail<Config extends LemurMailConfig['provider']['config']> {
    private templatesBasePath: string | null = null;
    private mailProvider: MailBuilder<any, Config, MailOptions> | null = null;
    private isInitialized: boolean = false; // Internal flag for initialization status
    private regex: RegExp | undefined = undefined;

    /**
     * Constructor for LemurMail. Initializes template path and mail provider.
     * Note: If 'path' is not provided and auto-detection is needed, you MUST call `.init()` afterward.
     * @param config The configuration object for template path and mail provider.
     * @param regex [RegExp] <body[^>]*>([\s\S]*?)<\/body>/
     */
    constructor(config: LemurMailConfig, regex?: RegExp) {
        if (!config || !config.provider || !config.provider.name || !config.provider.config) {
            throw new Error('Invalid configuration. "provider.name" and "provider.config" are required.');
        }

        this.regex = regex;

        // Initialize mail provider immediately as it's typically synchronous
        try {
            this.mailProvider = Manager.getProvider(
                config.provider.name, // Cast to ensure type compatibility
                config.provider.config
            );
        } catch (error: any) {
            throw new Error(`Failed to initialize mail provider "${config.provider.name}": ${error.message}`);
        }

        // Handle template path configuration
        if (config.path) {
            TemplateConfigManager.setPath(config.path);
            this.templatesBasePath = TemplateConfigManager.getPath();
            this.isInitialized = true; // Fully initialized if path is synchronous
        } else {
            TemplateConfigManager.autoDetectPath();
            this.templatesBasePath = TemplateConfigManager.getPath();
            this.isInitialized = true; // Fully initialized if path is synchronous
            // A warning might be useful here if not calling .init()
            console.warn('Template path not provided. Call `await lemurMailInstance.init()` to auto-detect.');
        }
    }

    /**
     * Asynchronously initializes the LemurMail instance.
     * This method is crucial if 'path' was not provided in the constructor
     * and template path auto-detection is required.
     * Must be awaited before calling `.template().send()`.
     */
    public async init(): Promise<void> {
        if (this.isInitialized) {
            console.log('LemurMail instance is already initialized.');
            return;
        }

        if (!this.templatesBasePath) { // Only auto-detect if path wasn't set manually
            try {
                await TemplateConfigManager.autoDetectPath();
                this.templatesBasePath = TemplateConfigManager.getPath();
            } catch (error: any) {
                throw new Error(`Failed to auto-detect template path: ${error.message}. Please provide 'path' manually or ensure config file exists.`);
            }
        }

        if (!this.templatesBasePath) {
            throw new Error('Template path could not be configured or auto-detected.');
        }

        this.isInitialized = true;
        console.log('LemurMail instance initialized successfully.');
    }

    /**
     * Prepares to send an email using a specific template.
     * @param templateName The name of the template (e.g., 'verification', 'welcome').
     * @returns An instance of TemplateMailer, allowing you to chain the .send() method.
     */
    public template(templateName: string) {
        if (!this.isInitialized) {
            throw new Error('LemurMail instance is not fully initialized. Call `await init()` first if template path needs auto-detection, or ensure path is provided in constructor.');
        }
        if (!this.mailProvider) {
            throw new Error('Mail provider is not available. Check LemurMail configuration.');
        }
        if (!this.templatesBasePath) {
            throw new Error('Template path is not available. Check LemurMail configuration or call `init()`.');
        }
        return new TemplateMailer(templateName, this.mailProvider, this.templatesBasePath, this.regex);
    }
}