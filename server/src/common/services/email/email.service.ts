import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const emailService = this.configService.get<string>('EMAIL_SERVICE');
    const emailUser = this.configService.get<string>('EMAIL_USER');
    const emailPassword = this.configService.get<string>('EMAIL_PASSWORD');
    const emailFrom = this.configService.get<string>('EMAIL_FROM');

    if (!emailUser || !emailPassword) {
      this.logger.warn(
        'Email credentials not configured. Email functionality will be disabled.',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      service: emailService || 'gmail',
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });

    this.logger.log(
      `Email service initialized with ${emailService || 'gmail'} (${emailFrom || emailUser})`,
    );
  }

  /**
   * Send employee invitation email
   */
  async sendEmployeeInvitation(
    email: string,
    tenantName: string,
    inviterName: string,
    invitationToken: string,
    role: string,
  ): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(
        'Email transporter not initialized. Skipping invitation email.',
      );
      return;
    }

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const acceptUrl = `${frontendUrl}/accept-invite?token=${invitationToken}`;

    const mailOptions = {
      from: this.configService.get<string>('EMAIL_FROM') || this.configService.get<string>('EMAIL_USER'),
      to: email,
      subject: `You've been invited to join ${tenantName} on SynapseCRM`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Team Invitation</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f7;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                        SynapseCRM
                      </h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
                        You're invited to join ${tenantName}
                      </h2>
                      <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                        <strong>${inviterName}</strong> has invited you to join <strong>${tenantName}</strong> as a <strong>${role}</strong> on SynapseCRM.
                      </p>
                      <p style="margin: 0 0 30px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                        Click the button below to accept the invitation and create your account. This invitation will expire in 7 days.
                      </p>
                      
                      <!-- CTA Button -->
                      <table role="presentation" style="margin: 0 auto;">
                        <tr>
                          <td style="border-radius: 6px; background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);">
                            <a href="${acceptUrl}" style="display: inline-block; padding: 14px 40px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600;">
                              Accept Invitation
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 30px 0 0 0; color: #9ca3af; font-size: 14px; line-height: 1.6;">
                        Or copy and paste this link into your browser:
                      </p>
                      <p style="margin: 10px 0 0 0; color: #6366f1; font-size: 14px; word-break: break-all;">
                        ${acceptUrl}
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                        This invitation was sent to ${email}
                      </p>
                      <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                        If you didn't expect this invitation, you can safely ignore this email.
                      </p>
                      <p style="margin: 20px 0 0 0; color: #9ca3af; font-size: 12px;">
                        © ${new Date().getFullYear()} SynapseCRM. All rights reserved.
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Employee invitation email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send invitation email to ${email}`, error);
      throw error;
    }
  }

  /**
   * Send customer portal invitation email
   */
  async sendCustomerPortalInvitation(
    email: string,
    tenantName: string,
    contactName: string,
    invitationToken: string,
  ): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(
        'Email transporter not initialized. Skipping customer invitation email.',
      );
      return;
    }

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const acceptUrl = `${frontendUrl}/portal/accept-invite?token=${invitationToken}`;

    const mailOptions = {
      from: this.configService.get<string>('EMAIL_FROM') || this.configService.get<string>('EMAIL_USER'),
      to: email,
      subject: `Access Your Customer Portal - ${tenantName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Customer Portal Access</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f7;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                        Customer Portal Access
                      </h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
                        Hi ${contactName},
                      </h2>
                      <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                        <strong>${tenantName}</strong> has created a customer portal account for you. You can now:
                      </p>
                      <ul style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.8; padding-left: 20px;">
                        <li>View your support tickets</li>
                        <li>Submit new tickets</li>
                        <li>Track ticket status and updates</li>
                        <li>Communicate with the support team</li>
                      </ul>
                      <p style="margin: 0 0 30px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                        Click the button below to set up your portal access. This link will expire in 7 days.
                      </p>
                      
                      <!-- CTA Button -->
                      <table role="presentation" style="margin: 0 auto;">
                        <tr>
                          <td style="border-radius: 6px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);">
                            <a href="${acceptUrl}" style="display: inline-block; padding: 14px 40px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600;">
                              Access Customer Portal
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 30px 0 0 0; color: #9ca3af; font-size: 14px; line-height: 1.6;">
                        Or copy and paste this link into your browser:
                      </p>
                      <p style="margin: 10px 0 0 0; color: #3b82f6; font-size: 14px; word-break: break-all;">
                        ${acceptUrl}
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                        This invitation was sent to ${email}
                      </p>
                      <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                        If you didn't expect this email, please contact ${tenantName} directly.
                      </p>
                      <p style="margin: 20px 0 0 0; color: #9ca3af; font-size: 12px;">
                        © ${new Date().getFullYear()} ${tenantName}. Powered by SynapseCRM.
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Customer portal invitation email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send customer invitation email to ${email}`, error);
      throw error;
    }
  }
}
