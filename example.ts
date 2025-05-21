// app.ts (or wherever you send emails)
import { LemurMail } from './src/lemurMail';

async function runEmailSender() {
    try {
        // --- EXAMPLE 1: Manual path, typical for dev/prod environments ---
        const SendMailManual = new LemurMail({
            path: './src/templates', // Provide your template root path explicitly
            provider: {
                name: 'smtp', // Make sure 'nodemailer' provider is handled by MailProviderManager
                config: {
                    host: 'smtp.ethereal.email',
                    port: 587,
                    secure: false,
                    auth: {
                        user: 'user@example.com', // Replace with actual credentials
                        pass: 'password',         // Replace with actual credentials
                    },
                }
            }
        });

        // No need to call .init() if 'path' is provided in constructor.
        // If your mail provider also requires async init, you'd add it here.

        console.log('Sending email with manual path...');
        await SendMailManual.template('welcome').send({
            to: 'recipient@example.com',
            from: 'Your App <noreply@your-app.com>',
            subject: 'Welcome to Our Service!',
        }, {
            userName: 'Jane Doe',
            appUrl: 'https://your-app.com',
        });
        console.log('Email sent successfully (Manual Path)!');

        console.log('------------------------------------');

        // --- EXAMPLE 2: Auto-detecting path (requires calling .init()) ---
        const SendMailAutoDetect = new LemurMail({
            // No 'path' provided here, so it will try to auto-detect
            provider: {
                name: 'gmail', // Example: using a 'gmail' provider
                config: {
                    auth: {
                        type: 'OAuth2',
                        clientId: 'your_client_id',
                        clientSecret: 'your_client_secret',
                        refreshToken: 'your_refresh_token',
                        user: 'your_gmail_account@gmail.com',
                    }
                }
            }
        });

        console.log('Initializing LemurMail instance for auto-detection...');
        await SendMailAutoDetect.init(); // IMPORTANT: Call init() for auto-detection

        console.log('Sending email with auto-detected path...');
        await SendMailAutoDetect.template('verification').send({
            to: 'another.user@example.com',
            from: 'Support <support@your-app.com>',
            subject: 'Please Verify Your Account',
        }, {
            email: 'another.user@example.com',
            verificationLink: 'https://your-app.com/verify/123',
        });
        console.log('Email sent successfully (Auto-Detect Path)!');

    } catch (error) {
        console.error('Failed to send email:', error);
    }
}

runEmailSender();