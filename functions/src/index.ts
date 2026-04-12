
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as sgMail from '@sendgrid/mail';

admin.initializeApp();

/**
 * Custom Password Reset Callable Function (v2)
 * Generates a secure reset link and sends a branded "Neat" email.
 */
export const sendCustomPasswordReset = onCall({
  // Use secrets for the API Key in production
  secrets: ['SENDGRID_API_KEY'],
  cors: true
}, async (request) => {
  const { email, continueUrl } = request.data;

  // Retrieve API Key from secrets or environment
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  if (SENDGRID_API_KEY) {
    sgMail.setApiKey(SENDGRID_API_KEY);
  } else {
    console.error('CRITICAL: SENDGRID_API_KEY is missing from environment. Did you set it in Firebase Secrets?');
  }

  if (!email) {
    throw new HttpsError('invalid-argument', 'Email is required.');
  }

  try {
    // 1. Verify user exists
    const userRecord = await admin.auth().getUserByEmail(email);
    
    // 2. Generate secure password reset link
    const actionCodeSettings = {
      url: continueUrl || 'https://doveneb--studio-7235955659-7c316.us-central1.hosted.app/reset-password',
      handleCodeInApp: true,
    };
    
    const resetLink = await admin.auth().generatePasswordResetLink(email, actionCodeSettings);

    // 3. Construct "Neat" Template Design
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #2563eb, #3b82f6); padding: 40px 20px; text-align: center; }
        .logo { background: #ffffff; padding: 12px; border-radius: 16px; width: 40px; height: 40px; margin: 0 auto 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .content { padding: 40px; color: #1e293b; line-height: 1.6; }
        h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; }
        p { margin: 0 0 20px; font-size: 16px; color: #475569; }
        .button-container { text-align: center; margin: 35px 0; }
        .button { background-color: #2563eb; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 4px 14px 0 rgba(37, 99, 235, 0.39); }
        .footer { background-color: #f1f5f9; padding: 30px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
        .security-badge { display: inline-flex; align-items: center; background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 9999px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">
            <img src="https://doveneb--studio-7235955659-7c316.us-central1.hosted.app/logo.png" alt="Logo" width="40" height="40">
          </div>
          <h1>Dove Neb</h1>
        </div>
        <div class="content">
          <div class="security-badge">
            <span style="margin-right: 5px;">&#128100;</span> Identity Verified
          </div>
          <p>Hello ${userRecord.displayName || 'there'},</p>
          <p>We received a request to reset your password for your Dove Neb account. To keep your account secure, please click the button below to choose a new password.</p>
          
          <div class="button-container">
            <a href="${resetLink}" class="button">Reset My Password</a>
          </div>
          
          <p>This secure link will expire in 1 hour. If you didn't request this change, you can safely ignore this email.</p>
          <p>Stay safe,<br>The Dove Neb Security Team</p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Dove Neb. All rights reserved.</p>
          <p>Where Opportunities Take Flight</p>
        </div>
      </div>
    </body>
    </html>
    `;

    // 4. Send Email
    const msg = {
      to: email,
      from: {
        email: 'noreply@doveneb.com', // Replace with verified sender
        name: 'Dove Neb Security'
      },
      subject: 'Reset Your Password | Dove Neb',
      html: htmlContent,
      trackingSettings: {
        clickTracking: { enable: false },
        openTracking: { enable: false }
      }
    };

    if (!SENDGRID_API_KEY) {
      console.log('--- TEST MODE: Link Generated ---');
      console.log('Reset Link:', resetLink);
      return { success: true, testMode: true, link: resetLink };
    }

    await sgMail.send(msg);
    return { success: true };

  } catch (error: any) {
    console.error('Password reset error:', error);
    if (error.code === 'auth/user-not-found') {
      // Don't reveal if user exists for security
      return { success: true };
    }
    throw new HttpsError('internal', error.message);
  }
});

