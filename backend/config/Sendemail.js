const nodemailer = require('nodemailer')

// Fail loudly and immediately if the SMTP env vars aren't loaded, instead of
// letting nodemailer silently fall back to localhost and fail later with a
// confusing ECONNREFUSED.
const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS']
const missing = requiredEnvVars.filter((key) => !process.env[key])
if (missing.length > 0) {
  throw new Error(
    `sendEmail.js: missing required env var(s): ${missing.join(', ')}. ` +
    `Check that .env sits next to server.js and that dotenv.config() runs before this module loads.`
  )
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for 587/others
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

/**
 * Send an email.
 * @param {Object} opts
 * @param {string} opts.to - recipient address
 * @param {string} opts.subject
 * @param {string} [opts.html]
 * @param {string} [opts.text]
 */
async function sendEmail({ to, subject, html, text }) {
  if (!to) throw new Error('sendEmail: "to" address is required')
  if (!subject) throw new Error('sendEmail: "subject" is required')

  const info = await transporter.sendMail({
    from: `"YDHome Clean" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html,
  })

  return info
}

module.exports = { sendEmail }