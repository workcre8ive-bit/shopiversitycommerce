import type { IncomingMessage, ServerResponse } from "http";
import axios from "axios";
import nodemailer from "nodemailer";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const recipient = String(
    req.body?.recipient || req.body?.to || req.query?.recipient || req.query?.to || "tommzypolaris@gmail.com"
  ).trim().toLowerCase();

  const AUTHORIZED_TEST_RECIPIENTS = new Set([
    "tommzypolaris@gmail.com",
    "fashinaayomide2005@gmail.com",
    "fashinaayomide@2005@gmail.com",
    "fashinaayomide12005@gmail.com",
    "shopiversitycommerce@gmail.com"
  ]);

  if (!AUTHORIZED_TEST_RECIPIENTS.has(recipient)) {
    return res.status(403).json({
      success: false,
      error: "Access restricted: Test emails can only be sent to the verified Shopiversity project owner (tommzypolaris@gmail.com) to prevent public open-relay abuse."
    });
  }

  const apiKey = (
    process.env.BREVO_API_KEY ||
    process.env.brevo_api_key ||
    process.env.BREVO_KEY ||
    process.env.brevo_key ||
    process.env.BREVO_SMTP_KEY ||
    process.env.VITE_BREVO_API_KEY ||
    req.body?.apiKey ||
    req.query?.apiKey ||
    ""
  ).trim();

  if (!apiKey || apiKey.length < 8) {
    return res.status(400).json({
      success: false,
      error: "BREVO_API_KEY is not configured in Vercel Environment Variables. Please ensure BREVO_API_KEY is added under Project Settings > Environment Variables as a secret."
    });
  }

  const fromEmail = process.env.BREVO_SENDER_EMAIL || "ShopiversityCommerce@gmail.com";
  const fromName = process.env.BREVO_SENDER_NAME || "SHOPIVERSITY Campus Marketplace";

  const testHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px;">
      <div style="text-align: center; padding-bottom: 24px; border-bottom: 2px solid #ff6b00;">
        <h1 style="color: #ff6b00; font-size: 28px; font-weight: 900; margin: 0; letter-spacing: -0.5px;">SHOPIVERSITY</h1>
        <p style="color: #64748b; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-top: 6px;">Campus Marketplace • Brevo Email Integration</p>
      </div>

      <div style="background: linear-gradient(135deg, #ff6b00 0%, #ea580c 100%); padding: 28px 24px; border-radius: 20px; color: #ffffff; margin: 28px 0; text-align: center; box-shadow: 0 10px 25px -5px rgba(255, 107, 0, 0.3);">
        <div style="font-size: 40px; margin-bottom: 8px;">🚀</div>
        <h2 style="font-size: 22px; font-weight: 800; margin: 0 0 10px 0; color: #ffffff;">Brevo Connection Live &amp; Verified!</h2>
        <p style="font-size: 14px; margin: 0; opacity: 0.95; line-height: 1.6;">
          Your Brevo transactional email engine is functioning with 100% operational integrity on SHOPIVERSITY.
        </p>
      </div>

      <div style="background-color: #f8fafc; padding: 20px 24px; border-radius: 18px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
        <h3 style="font-size: 13px; font-weight: 800; color: #0f172a; margin: 0 0 14px 0; text-transform: uppercase; letter-spacing: 1px;">Integration Verification Details:</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #334155;">
          <tr>
            <td style="padding: 6px 0; font-weight: 700; width: 35%;">Service Provider:</td>
            <td style="padding: 6px 0; color: #ff6b00; font-weight: 800;">Brevo (Sendinblue) Transactional v3</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 700;">Sender Address:</td>
            <td style="padding: 6px 0;">${fromEmail}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 700;">Verified Recipient:</td>
            <td style="padding: 6px 0; font-weight: 700;">${recipient}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 700;">Security Status:</td>
            <td style="padding: 6px 0; color: #16a34a; font-weight: 700;">✓ Restricted &amp; Authenticated</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 700;">Server Timestamp:</td>
            <td style="padding: 6px 0; font-mono; font-size: 12px;">${new Date().toISOString()}</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #fff7ed; padding: 16px 20px; border-radius: 16px; border: 1px solid #fed7aa; margin-bottom: 24px;">
        <h4 style="font-size: 12px; font-weight: 800; color: #c2410c; margin: 0 0 6px 0; text-transform: uppercase;">Active Automated Notifications:</h4>
        <p style="font-size: 12px; color: #9a3412; margin: 0; line-height: 1.6;">
          • Welcome &amp; Signup Verification Codes<br/>
          • Password Reset Instructions<br/>
          • Order Placement &amp; Escrow Payment Receipts<br/>
          • Vendor Sales Alerts &amp; Logistics Dispatch Updates<br/>
          • 3-Day Refund Countdown &amp; Return Processing
        </p>
      </div>

      <div style="text-align: center; color: #94a3b8; font-size: 11px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
        <p style="margin: 0;">SHOPIVERSITY Campus Marketplace • Multi-Campus Student Commerce &amp; Escrow System</p>
        <p style="margin: 4px 0 0 0;">Need support? Contact <a href="mailto:shopiversitycommerce@gmail.com" style="color: #ff6b00; text-decoration: none; font-weight: 700;">shopiversitycommerce@gmail.com</a></p>
      </div>
    </div>
  `;

  // Brevo SMTP Relay fallback if key starts with xsmtpsib-
  if (apiKey.startsWith("xsmtpsib-")) {
    try {
      const transporter = nodemailer.createTransport({
        host: "smtp-relay.brevo.com",
        port: 587,
        secure: false,
        auth: {
          user: fromEmail,
          pass: apiKey
        }
      });

      const info = await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: recipient,
        subject: "🚀 SHOPIVERSITY & Brevo Email Test Successful",
        html: testHtml
      });

      return res.status(200).json({
        success: true,
        provider: "brevo-smtp",
        messageId: info.messageId,
        recipient,
        sender: fromEmail,
        timestamp: new Date().toISOString(),
        message: `Secure test email successfully delivered to ${recipient} via Brevo SMTP Relay!`
      });
    } catch (smtpErr: any) {
      return res.status(400).json({
        success: false,
        error: `Brevo SMTP Relay error: ${smtpErr.message}`
      });
    }
  }

  // Standard Brevo REST API v3
  try {
    const brevoPayload = {
      sender: { name: fromName, email: fromEmail },
      to: [{ email: recipient }],
      subject: "🚀 SHOPIVERSITY & Brevo Email Test Successful",
      htmlContent: testHtml,
      tags: ["test-email", "security-verified", "shopiversity-brevo"]
    };

    const response = await axios.post("https://api.brevo.com/v3/smtp/email", brevoPayload, {
      headers: {
        "accept": "application/json",
        "api-key": apiKey,
        "content-type": "application/json"
      },
      timeout: 10000
    });

    const messageId = response.data?.messageId || response.data?.id || `BREVO_${Date.now()}`;
    return res.status(200).json({
      success: true,
      provider: "brevo",
      messageId,
      recipient,
      sender: fromEmail,
      timestamp: new Date().toISOString(),
      message: `Secure test email successfully delivered to ${recipient} via Brevo REST API!`
    });
  } catch (err: any) {
    const errorData = err.response?.data;
    const msg = errorData?.message || err.message || "Unknown error";
    return res.status(err.response?.status || 400).json({
      success: false,
      error: `Brevo API error: ${msg}`,
      details: errorData
    });
  }
}
