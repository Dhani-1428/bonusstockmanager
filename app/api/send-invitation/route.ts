import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

/**
 * Email configuration
 * 
 * To configure email sending, set these environment variables in your .env.local file:
 * 
 * SMTP_HOST=smtp.gmail.com (or your SMTP server)
 * SMTP_PORT=587
 * SMTP_SECURE=false (true for port 465, false for other ports)
 * SMTP_USER=your-email@gmail.com
 * SMTP_PASSWORD=your-app-password (for Gmail, use App Password: https://support.google.com/accounts/answer/185833)
 * 
 * For Gmail:
 * 1. Enable 2-factor authentication
 * 2. Generate an App Password: https://myaccount.google.com/apppasswords
 * 3. Use the App Password as SMTP_PASSWORD
 * 
 * For other providers (SendGrid, Mailgun, etc.), use their SMTP settings.
 * 
 * If no credentials are provided, the app will use a test account (emails won't actually be sent).
 * Check the console for preview URLs in development mode.
 */
const createTransporter = async () => {
  const emailConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASSWORD || '',
    },
  }

  // If no credentials provided, use a test account (won't actually send emails)
  // In development, check console for preview URL
  if (!emailConfig.auth.user || !emailConfig.auth.pass) {
    console.warn('⚠️  No SMTP credentials found. Using test account. Emails will not be sent.')
    console.warn('   Set SMTP_USER and SMTP_PASSWORD in .env.local to enable email sending.')
    try {
      const testAccount = await nodemailer.createTestAccount()
      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      })
    } catch {
      // Fallback if test account creation fails
      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: 'test@ethereal.email',
          pass: 'test',
        },
      })
    }
  }

  return nodemailer.createTransport(emailConfig)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, role, shopName, invitationLink, temporaryPassword } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const transporter = await createTransporter()

    // Email template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invitation to Join ${shopName || 'Stock Manager'}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">You've Been Invited!</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Hello${name ? ` ${name}` : ''},</p>
            
            <p style="font-size: 16px;">
              You have been invited to join <strong>${shopName || 'our Stock Management System'}</strong> as a <strong>${role.charAt(0).toUpperCase() + role.slice(1)}</strong>.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea;">
              <p style="margin: 0 0 10px 0;"><strong>Your Login Credentials:</strong></p>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
              <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-size: 14px;">${temporaryPassword}</code></p>
            </div>
            
            <p style="font-size: 16px;">
              Please use these credentials to log in. We recommend changing your password after your first login.
            </p>
            
            ${invitationLink ? `
              <div style="text-align: center; margin: 30px 0;">
                <a href="${invitationLink}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  Accept Invitation & Login
                </a>
              </div>
            ` : ''}
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666;">
              <p style="margin: 5px 0;">If you have any questions, please contact your administrator.</p>
              <p style="margin: 5px 0;">This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `

    const emailText = `
Hello${name ? ` ${name}` : ''},

You have been invited to join ${shopName || 'our Stock Management System'} as a ${role.charAt(0).toUpperCase() + role.slice(1)}.

Your Login Credentials:
Email: ${email}
Temporary Password: ${temporaryPassword}

Please use these credentials to log in. We recommend changing your password after your first login.

${invitationLink ? `Accept Invitation: ${invitationLink}` : ''}

If you have any questions, please contact your administrator.
This is an automated message, please do not reply to this email.
    `

    const mailOptions = {
      from: `"${shopName || 'Stock Manager'}" <${process.env.SMTP_USER || 'noreply@stockmanager.com'}>`,
      to: email,
      subject: `Invitation to Join ${shopName || 'Stock Manager'}`,
      text: emailText,
      html: emailHtml,
    }

    const info = await transporter.sendMail(mailOptions)

    // In development with test account, log the preview URL
    if (process.env.NODE_ENV === 'development' && !process.env.SMTP_USER) {
      const previewUrl = nodemailer.getTestMessageUrl(info)
      if (previewUrl) {
        console.log('📧 Email preview URL (test account):', previewUrl)
        console.log('   Note: This is a test email. Configure SMTP credentials to send real emails.')
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation email sent successfully',
      messageId: info.messageId,
      previewUrl: process.env.NODE_ENV === 'development' && !process.env.SMTP_USER 
        ? nodemailer.getTestMessageUrl(info) 
        : undefined,
    })
  } catch (error: any) {
    console.error('Error sending invitation email:', error)
    return NextResponse.json(
      {
        error: 'Failed to send invitation email',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
