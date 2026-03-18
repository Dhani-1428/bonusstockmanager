import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

type AuthEmailType = 'signup' | 'login'

const createTransporter = async () => {
  const smtpUser = process.env.SMTP_USER || 'bonusstockmanager@gmail.com'
  const smtpPass = process.env.SMTP_PASSWORD || 'qmtl dmod lzco swuh'

  // Use Gmail SMTP by default.
  const host = process.env.SMTP_HOST || 'smtp.gmail.com'
  const port = parseInt(process.env.SMTP_PORT || '587', 10)
  const secure = process.env.SMTP_SECURE === 'true'

  // If password is not available, fall back to ethereal (emails won't be delivered).
  if (!smtpUser || !smtpPass) {
    console.warn('⚠️  No SMTP credentials found. Using test account transporter.')
    const testAccount = await nodemailer.createTestAccount()
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: { user: testAccount.user, pass: testAccount.pass },
    })
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user: smtpUser, pass: smtpPass },
  })
}

const buildEmailHtml = (type: AuthEmailType, data: any) => {
  const fromTitle = 'Bonus Stock Manager'

  if (type === 'signup') {
    return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Your ${fromTitle} Credentials</title>
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
      <h1 style="color: white; margin: 0;">Welcome to ${fromTitle}!</h1>
    </div>
    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
      <p style="font-size: 16px;">Hello${data.name ? ` ${data.name}` : ''},</p>
      <p style="font-size: 16px;">Your account has been created. Here are your login credentials:</p>
      <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea;">
        <p style="margin: 0 0 10px 0;"><strong>Your Login Credentials:</strong></p>
        <p style="margin: 5px 0;"><strong>Username:</strong> ${data.username}</p>
        <p style="margin: 5px 0;"><strong>Email:</strong> ${data.email}</p>
        <p style="margin: 5px 0;"><strong>Password:</strong> <code style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-size: 14px;">${data.password}</code></p>
      </div>
      <p style="font-size: 16px;">Please use these credentials to log in. We recommend changing your password after your first login.</p>
      <p style="font-size: 14px; color: #666; margin-top: 22px;">This is an automated message, please do not reply to this email.</p>
    </div>
  </body>
</html>`
  }

  // login
  const loginTime = data.loginTime ? new Date(data.loginTime).toLocaleString() : new Date().toLocaleString()
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${fromTitle} Login</title>
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
      <h1 style="color: white; margin: 0;">Login Successful</h1>
    </div>
    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
      <p style="font-size: 16px;">Hello${data.name ? ` ${data.name}` : ''},</p>
      <p style="font-size: 16px;">We detected a login to your ${fromTitle} panel.</p>
      <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea;">
        <p style="margin: 0 0 10px 0;"><strong>Login details:</strong></p>
        <p style="margin: 5px 0;"><strong>Username:</strong> ${data.username}</p>
        <p style="margin: 5px 0;"><strong>Email:</strong> ${data.email}</p>
        <p style="margin: 5px 0;"><strong>Time:</strong> ${loginTime}</p>
      </div>
      <p style="font-size: 14px; color: #666; margin-top: 22px;">This is an automated message, please do not reply to this email.</p>
    </div>
  </body>
</html>`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, email, name, username, password, loginTime } = body as {
      type: AuthEmailType
      email: string
      name?: string
      username: string
      password?: string
      loginTime?: string
    }

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const transporter = await createTransporter()

    const mailOptions = {
      from: `"Bonus Stock Manager" <${process.env.SMTP_USER || 'bonusstockmanager@gmail.com'}>`,
      to: email,
      subject:
        type === 'signup'
          ? 'Your Bonus Stock Manager credentials'
          : 'Bonus Stock Manager login successful',
      html: buildEmailHtml(type, { name, email, username, password, loginTime }),
      text:
        type === 'signup'
          ? `Welcome! Username: ${username} Email: ${email} Password: ${password}`
          : `Login successful for ${username} (${email}) at ${loginTime || new Date().toISOString()}`,
    }

    const info = await transporter.sendMail(mailOptions)

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
    })
  } catch (error: any) {
    console.error('Error sending auth email:', error)
    return NextResponse.json(
      { error: 'Failed to send auth email', details: error?.message || String(error) },
      { status: 500 }
    )
  }
}

