const APP_NAME = process.env.APP_NAME || 'YD HOME';
const COMPANY_NAME = 'Yencode Technologies';
const BRAND_COLOR = '#0B6A61';
const BRAND_DARK = '#084a44';

// Prevents names or other text from breaking the HTML
const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// Shared layout used by every email
const layout = ({ preheader = '', bodyHtml }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(APP_NAME)}</title>
</head>
<body style="margin:0; padding:0; background-color:#f3f4f6; font-family:Arial, Helvetica, sans-serif;">
  <!-- Hidden preview text shown in the inbox list -->
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:#f3f4f6;">
    ${escapeHtml(preheader)}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6; padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%; max-width:600px; background-color:#ffffff; border-radius:14px; overflow:hidden; border:1px solid #e5e7eb;">

          <!-- Header -->
          <tr>
            <td align="center" style="background-color:${BRAND_COLOR}; background-image:linear-gradient(135deg, ${BRAND_COLOR}, ${BRAND_DARK}); padding:32px 24px;">
              <div style="font-size:22px; font-weight:bold; color:#ffffff; letter-spacing:0.3px;">${escapeHtml(APP_NAME)}</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 36px 12px 36px; color:#1f2937; font-size:15px; line-height:1.65;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 36px 32px 36px; border-top:1px solid #f1f5f9;">
              <p style="margin:0; font-size:12px; line-height:1.6; color:#9ca3af; text-align:center;">
                This is an automated message, please do not reply.<br />
                &copy; ${new Date().getFullYear()} ${escapeHtml(COMPANY_NAME)}. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

// Button that works in Outlook as well
const button = (label, url) => `
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px auto;">
  <tr>
    <td align="center" bgcolor="${BRAND_COLOR}" style="border-radius:8px;">
      <a href="${url}" target="_blank" style="display:inline-block; padding:14px 34px; font-size:15px; font-weight:bold; color:#ffffff; text-decoration:none; border-radius:8px;">
        ${escapeHtml(label)}
      </a>
    </td>
  </tr>
</table>`;

// ---------------------------------------------------------
// 1. Welcome email (account created by admin)
// ---------------------------------------------------------
const welcomeEmail = ({ name, email, password, accessUrl }) => {
  const bodyHtml = `
    <h2 style="margin:0 0 12px 0; font-size:22px; color:#111827;">Welcome, ${escapeHtml(name)}! 👋</h2>
    <p style="margin:0 0 20px 0;">An administrator has created your account. Here are your sign-in details:</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:10px;">
      <tr>
        <td style="padding:18px 20px;">
          <p style="margin:0 0 4px 0; font-size:11px; font-weight:bold; letter-spacing:1px; color:#6b7280; text-transform:uppercase;">Username (Email)</p>
          <p style="margin:0 0 16px 0; font-size:15px; font-weight:bold; color:#111827;">${escapeHtml(email)}</p>
          <p style="margin:0 0 4px 0; font-size:11px; font-weight:bold; letter-spacing:1px; color:#6b7280; text-transform:uppercase;">Password</p>
          <p style="margin:0; font-size:15px; font-weight:bold; color:#111827; font-family:'Courier New', monospace;">${escapeHtml(password)}</p>
        </td>
      </tr>
    </table>

    <p style="margin:26px 0 0 0; text-align:center;">Prefer not to type anything? Open your dashboard directly:</p>
    ${button('Open My Dashboard', accessUrl)}

    <p style="margin:0; font-size:12px; color:#6b7280; text-align:center; word-break:break-all;">
      Button not working? Copy this link into your browser:<br />
      <a href="${accessUrl}" style="color:${BRAND_COLOR};">${accessUrl}</a>
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:26px; background-color:#fffbeb; border:1px solid #fde68a; border-radius:10px;">
      <tr>
        <td style="padding:14px 18px; font-size:13px; line-height:1.6; color:#92400e;">
          <strong>Keep this link private.</strong> Anyone who has it can open your dashboard. Please sign in and change your password as soon as possible.
        </td>
      </tr>
    </table>
  `;

  const text =
    `Welcome, ${name}!\n\n` +
    `An administrator has created your account.\n\n` +
    `Username (Email): ${email}\n` +
    `Password: ${password}\n\n` +
    `Open your dashboard directly (no login needed):\n${accessUrl}\n\n` +
    `Keep this link private. Please change your password as soon as possible.`;

  return {
    subject: 'Your Account Has Been Created',
    html: layout({ preheader: 'Your account is ready. Open your dashboard in one click.', bodyHtml }),
    text
  };
};

// ---------------------------------------------------------
// 2. Password reset email
// ---------------------------------------------------------
const resetPasswordEmail = ({ resetUrl }) => {
  const bodyHtml = `
    <h2 style="margin:0 0 12px 0; font-size:22px; color:#111827;">Reset your password 🔒</h2>
    <p style="margin:0;">We received a request to reset the password for your account. Click the button below to choose a new one.</p>

    ${button('Reset Password', resetUrl)}

    <p style="margin:0; font-size:13px; color:#6b7280; text-align:center;">This link will expire in <strong>10 minutes</strong>.</p>

    <p style="margin:20px 0 0 0; font-size:12px; color:#6b7280; text-align:center; word-break:break-all;">
      Button not working? Copy this link into your browser:<br />
      <a href="${resetUrl}" style="color:${BRAND_COLOR};">${resetUrl}</a>
    </p>

    <p style="margin:26px 0 0 0; font-size:13px; color:#6b7280;">
      If you did not request this, you can safely ignore this email. Your password will not change.
    </p>
  `;

  const text =
    `You requested a password reset.\n\n` +
    `Please click the link below to reset your password:\n\n${resetUrl}\n\n` +
    `This link expires in 10 minutes.\n\n` +
    `If you did not request this, please ignore this email.`;

  return {
    subject: 'Password Reset Request',
    html: layout({ preheader: 'Use this link to reset your password. It expires in 10 minutes.', bodyHtml }),
    text
  };
};

module.exports = { welcomeEmail, resetPasswordEmail };