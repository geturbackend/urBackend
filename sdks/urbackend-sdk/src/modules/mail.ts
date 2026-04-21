import { UrBackendClient } from '../client';
import { SendMailPayload, SendMailResponse } from '../types';

/**
 * Module for handling email operations in urBackend
 * 
 * @class MailModule
 * @description Provides methods to send emails using the urBackend mail service.
 * Requires a Secret Key (sk_live_...) and should be called from a server environment.
 * 
 * @example
 * // Initialize the mail module
 * const client = new UrBackendClient({ secretKey: 'sk_live_xxx' });
 * const mail = new MailModule(client);
 * 
 * // Send an email
 * const result = await mail.send({
 *   to: 'user@example.com',
 *   subject: 'Welcome!',
 *   html: '<h1>Hello World</h1>'
 * });
 */
export class MailModule {
  /**
   * Creates an instance of MailModule
   * 
   * @param {UrBackendClient} client - The authenticated urBackend client instance
   * 
   * @example
   * const client = new UrBackendClient({ secretKey: 'sk_live_xxx' });
   * const mail = new MailModule(client);
   */
  constructor(private client: UrBackendClient) {}

  /**
   * Sends an email using the urBackend mail service
   * 
   * @param {SendMailPayload} payload - The email content and configuration
   * @param {string} payload.to - Recipient email address
   * @param {string} payload.subject - Email subject line
   * @param {string} payload.html - HTML content of the email
   * @param {string} [payload.from] - Optional sender email address (defaults to configured sender)
   * @param {string[]} [payload.cc] - Optional CC recipient email addresses
   * @param {string[]} [payload.bcc] - Optional BCC recipient email addresses
   * @returns {Promise<SendMailResponse>} Promise resolving to email sending status and message ID
   * 
   * @throws {Error} If secret key is missing or invalid
   * @throws {Error} If email validation fails
   * @throws {Error} If rate limit is exceeded
   * 
   * @example
   * // Send a basic email
   * const result = await mail.send({
   *   to: 'user@example.com',
   *   subject: 'Welcome to urBackend',
   *   html: '<h1>Welcome!</h1><p>Thanks for joining.</p>'
   * });
   * console.log(result.messageId);
   * 
   * @example
   * // Send an email with CC and custom sender
   * const result = await mail.send({
   *   from: 'noreply@myapp.com',
   *   to: 'user@example.com',
   *   cc: ['admin@example.com'],
   *   subject: 'Important Update',
   *   html: '<p>Your account has been updated.</p>'
   * });
   * 
   * @example
   * // Send email with error handling
   * try {
   *   const result = await mail.send({
   *     to: 'user@example.com',
   *     subject: 'Test',
   *     html: '<p>Test email</p>'
   *   });
   *   console.log('Email sent:', result);
   * } catch (error) {
   *   console.error('Failed to send email:', error);
   * }
   */
  public async send(payload: SendMailPayload): Promise<SendMailResponse> {
    return this.client.request<SendMailResponse>('POST', '/api/mail/send', {
      body: payload,
    });
  }
}