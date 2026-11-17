import { BUYER_EMAIL_TEMPLATES } from "./emailCatalogBuyer.js";
import { SELLER_EMAIL_TEMPLATES } from "./emailCatalogSeller.js";
import { LOGISTICS_EMAIL_TEMPLATES } from "./emailCatalogLogistics.js";
import { EmailRecipientCategory, EmailTemplateDefinition, EmailVariableMap } from "./emailTypes.js";

export * from "./emailTypes.js";
export { BUYER_EMAIL_TEMPLATES, SELLER_EMAIL_TEMPLATES, LOGISTICS_EMAIL_TEMPLATES };

export const SHOPIVERSITY_EMAIL_TEMPLATES: EmailTemplateDefinition[] = [
  ...BUYER_EMAIL_TEMPLATES,
  ...SELLER_EMAIL_TEMPLATES,
  ...LOGISTICS_EMAIL_TEMPLATES
];

const TEMPLATE_BY_ID = new Map<string, EmailTemplateDefinition>(
  SHOPIVERSITY_EMAIL_TEMPLATES.map((t) => [t.id, t])
);

export function getEmailTemplateById(id: string): EmailTemplateDefinition | undefined {
  return TEMPLATE_BY_ID.get(id);
}

export function getEmailTemplatesByCategory(category: EmailRecipientCategory): EmailTemplateDefinition[] {
  return SHOPIVERSITY_EMAIL_TEMPLATES.filter((t) => t.recipientCategory === category);
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeOrigin(origin?: string): string {
  const clean = (origin || "").trim().replace(/\/+$/, "");
  if (clean && /^https?:\/\//i.test(clean)) return clean;
  return "https://shopiversity.app";
}

export function buildDefaultEmailVariables(
  overrides: EmailVariableMap = {},
  origin?: string
): Record<string, string> {
  const appOrigin = normalizeOrigin(
    typeof overrides.app_origin === "string" ? overrides.app_origin : origin
  );
  const supportEmail = String(
    overrides.support_email || "shopiversitycommerce@gmail.com"
  ).trim();
  const recipientEmail = String(overrides.recipient_email || "").trim();
  const recipientCategory = String(overrides.recipient_category || "").trim();

  const base: Record<string, string> = {
    app_origin: appOrigin,
    logo_url: `${appOrigin}/shopiversity-logo.png`,
    support_email: supportEmail,
    dashboard_url:
      String(overrides.dashboard_url || "").trim() ||
      `${appOrigin}/?tab=${recipientCategory === "seller" ? "seller" : recipientCategory === "logistics" ? "logistics" : "marketplace"}`,
    preferences_url: `${appOrigin}/?tab=profile&section=email-preferences`,
    unsubscribe_url: recipientEmail
      ? `${appOrigin}/api/emails/unsubscribe?email=${encodeURIComponent(recipientEmail)}`
      : `${appOrigin}/?tab=profile&section=email-preferences`,
    terms_url: `${appOrigin}/?tab=support`,
    privacy_url: `${appOrigin}/?tab=support`,
    year: String(new Date().getFullYear()),
    campus_name: "University Main Campus"
  };

  for (const [key, rawVal] of Object.entries(overrides)) {
    if (rawVal === undefined || rawVal === null) continue;
    base[key] = String(rawVal);
  }

  // Alias normalization so callers & templates match seamlessly
  if (!base.stock_count && base.stock_remaining) base.stock_count = base.stock_remaining;
  if (!base.stock_remaining && base.stock_count) base.stock_remaining = base.stock_count;
  if (!base.ticket_id && base.support_ticket_id) base.ticket_id = base.support_ticket_id;
  if (!base.support_ticket_id && base.ticket_id) base.support_ticket_id = base.ticket_id;
  if (!base.bank_account_summary && base.bank_account) base.bank_account_summary = base.bank_account;
  if (!base.bank_account && base.bank_account_summary) base.bank_account = base.bank_account_summary;
  if (!base.device_info && base.device_name) base.device_info = base.device_name;
  if (!base.event_timestamp && base.login_time) base.event_timestamp = base.login_time;
  if (!base.resolution_notes && base.resolution_summary) base.resolution_notes = base.resolution_summary;
  if (!base.previous_price && base.old_price) base.previous_price = base.old_price;

  return base;
}

export function getSampleEmailVariables(
  templateId?: string,
  origin?: string
): Record<string, string> {
  const appOrigin = normalizeOrigin(origin);
  const tpl = templateId ? getEmailTemplateById(templateId) : undefined;
  const cat = tpl?.recipientCategory || "buyer";

  return buildDefaultEmailVariables(
    {
      recipient_category: cat,
      recipient_email: "student.demo@shopiversity.edu.ng",
      buyer_name: "Amina Yusuf",
      seller_name: "Tunde Electronics",
      courier_name: "SwiftCampus Dispatch Ltd",
      store_name: "Tunde Campus Tech Hub",
      campus_name: "University of Lagos (UNILAG)",
      order_id: "SHPV-2026-84920",
      product_name: "Apple MacBook Air M2 (16GB / 256GB)",
      quantity: "1",
      order_total: "NGN 485,000",
      item_subtotal: "NGN 480,000",
      delivery_fee: "NGN 5,000",
      commission_amount: "NGN 14,400",
      net_earnings: "NGN 465,600",
      available_balance: "NGN 312,500",
      payment_status: "Paid (Escrow Held)",
      payment_method: "Paystack Online Escrow",
      delivery_status: "In Transit",
      tracking_number: "TRK-UNILAG-4829",
      pickup_address: "Shop 14, New Hall Commercial Complex, UNILAG",
      delivery_address: "Moremi Hall Annex, Room 214, UNILAG",
      estimated_delivery_date: "Today, 4:30 PM - 6:00 PM",
      verification_code: "482910",
      reset_code: "739201",
      delivery_pin: "592814",
      seller_handover_pin: "381045",
      device_name: "Chrome on Android 15 (Mobile)",
      device_info: "Chrome 131 on Android 15 (Mobile)",
      login_location: "Lagos, Nigeria",
      login_time: new Date().toUTCString(),
      event_timestamp: new Date().toUTCString(),
      updated_fields: "Campus Hall, Phone Number & Payout Bank",
      failure_reason: "Card issuer declined authorization (Insufficient Funds).",
      cancellation_reason: "Buyer updated delivery schedule before seller dispatch.",
      rejection_reason: "Uploaded government ID photo was blurry; please re-upload a clear image.",
      suspension_reason: "Multiple unresolved delayed shipments exceeding 72 hours.",
      ban_type: "Temporary Suspension (7 Days)",
      suspension_until: "7 Days (Pending Compliance Check)",
      account_status: "Suspended Pending Review",
      status_reason: "Repeated missed campus pickup windows; upload SLA plan to restore.",
      reinstatement_note: "All pending orders cleared and verification documents confirmed.",
      deactivation_reason: "Seller paused inventory during mid-semester exam period.",
      fulfilled_items: "MacBook Air M2 Sleeve (x1)",
      pending_items: "USB-C Multiport Adapter (x1) — shipping tomorrow",
      refund_id: "REF-88412",
      refund_amount: "NGN 485,000",
      refund_reason: "Delivered charger specification differed from listing.",
      payout_id: "PAY-39014",
      payout_amount: "NGN 192,500",
      bank_account: "GTBank (••••4821)",
      bank_account_summary: "GTBank ••••4821 (Tunde Ventures)",
      payout_schedule: "Within 24 Business Hours",
      old_price: "NGN 520,000",
      previous_price: "NGN 520,000",
      new_price: "NGN 485,000",
      discount_badge: "7% OFF CAMPUS DEAL",
      stock_remaining: "2 units",
      stock_count: "2 units",
      cart_items_summary: "MacBook Air M2 + Wireless Mouse (2 items)",
      cart_total: "NGN 497,500",
      promo_title: "Mid-Semester Campus Tech Week",
      promo_summary: "Enjoy up to 20% off verified student electronics & hostel essentials.",
      promo_code: "CAMPUS20",
      support_ticket_id: "TCK-741029",
      ticket_id: "TCK-741029",
      ticket_subject: "Escrow confirmation question on order SHPV-2026-84920",
      ticket_category: "Order & Payment Escrow",
      resolution_summary: "Escrow status verified and payout schedule synced with buyer confirmation.",
      resolution_notes: "Escrow verification completed and settlement schedule synchronized.",
      report_reason: "Product title did not match attached specifications.",
      policy_title: "Updated 72-Hour Escrow & Logistics PIN Handover Policy",
      announcement_title: "Updated 72-Hour Escrow & Logistics PIN Handover Policy",
      announcement_summary: "All campus courier deliveries now enforce dual PIN verification (Seller Handover PIN at pickup + Buyer Delivery PIN at drop-off) for faster escrow payouts.",
      policy_effective_date: "Effective Next Monday",
      effective_date: "Monday, Dec 1, 2026",
      report_period: "Nov 08 - Nov 14, 2026",
      orders_count: "34 Completed Deliveries",
      deleted_products_count: "12 listings",
      gross_sales: "NGN 642,000",
      weekly_revenue: "NGN 642,000",
      monthly_revenue: "NGN 2,480,000",
      rating_average: "4.9 / 5.0",
      average_rating: "4.9 / 5.0",
      dashboard_url:
        cat === "seller"
          ? `${appOrigin}/?tab=seller`
          : cat === "logistics"
            ? `${appOrigin}/?tab=logistics`
            : `${appOrigin}/?tab=marketplace`,
      review_url: `${appOrigin}/?tab=orders`,
      checkout_url: `${appOrigin}/?tab=cart`,
      product_url: `${appOrigin}/?tab=marketplace`
    },
    appOrigin
  );
}

export function interpolateTemplate(
  template: string,
  variables: EmailVariableMap,
  options: { htmlEscapeValues?: boolean } = {}
): string {
  if (!template) return "";
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => {
    const raw = variables[key];
    if (raw === undefined || raw === null) return "";
    const str = String(raw);
    return options.htmlEscapeValues ? escapeHtml(str) : str;
  });
}

export interface RenderedEmailContent {
  subject: string;
  previewText: string;
  html: string;
  text: string;
}

export function renderShopiversityEmailHtml(
  template: EmailTemplateDefinition,
  rawVariables: EmailVariableMap,
  origin?: string
): string {
  const vars = buildDefaultEmailVariables(
    {
      ...rawVariables,
      recipient_category: template.recipientCategory
    },
    origin
  );

  const subject = interpolateTemplate(template.subjectTemplate, vars);
  const previewText = interpolateTemplate(template.previewTextTemplate, vars);
  const heroTitle = interpolateTemplate(template.heroTitleTemplate, vars, { htmlEscapeValues: true });
  const greeting = interpolateTemplate(template.greetingTemplate, vars, { htmlEscapeValues: true });
  const ctaLabel = interpolateTemplate(template.ctaLabel, vars, { htmlEscapeValues: true });
  const ctaUrl = interpolateTemplate(template.ctaUrlTemplate, vars) || vars.dashboard_url;
  const dashboardUrl = vars.dashboard_url;
  const supportEmail = vars.support_email;
  const logoUrl = vars.logo_url;
  const unsubscribeUrl = vars.unsubscribe_url;
  const preferencesUrl = vars.preferences_url;

  const paragraphsHtml = template.bodyParagraphs
    .map((p) => {
      const rendered = interpolateTemplate(p, vars, { htmlEscapeValues: true });
      return `<p style="margin:0 0 14px 0;font-size:15px;line-height:1.65;color:#1e293b;">${rendered}</p>`;
    })
    .join("\n");

  const visibleRows = template.detailRows.filter((row) => {
    if (!row.hideIfEmptyVar) return true;
    const val = vars[row.hideIfEmptyVar];
    return Boolean(val && String(val).trim().length > 0);
  });

  const detailRowsHtml = visibleRows.length
    ? `
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:18px 0 6px 0;border-collapse:collapse;background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
        ${visibleRows
          .map((row, idx) => {
            const valHtml = interpolateTemplate(row.valueTemplate, vars, { htmlEscapeValues: true });
            const borderStyle = idx < visibleRows.length - 1 ? "border-bottom:1px solid #e2e8f0;" : "";
            return `
              <tr>
                <td style="padding:10px 14px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.4px;width:40%;${borderStyle}">${escapeHtml(row.label)}</td>
                <td style="padding:10px 14px;font-size:13px;font-weight:700;color:#0f172a;text-align:right;${borderStyle}">${valHtml}</td>
              </tr>
            `;
          })
          .join("")}
      </table>
    `
    : "";

  const pinVal = template.highlightPinVar ? String(vars[template.highlightPinVar] || "").trim() : "";
  const pinHtml = pinVal
    ? `
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0;">
        <tr>
          <td align="center" style="background-color:#fff7ed;border:2px dashed #ff6b00;border-radius:14px;padding:18px 16px;">
            <div style="font-size:11px;font-weight:800;color:#9a3412;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:6px;">
              ${escapeHtml(template.highlightPinLabel || "Security Code")}
            </div>
            <div style="font-size:32px;font-weight:900;letter-spacing:8px;color:#ea580c;font-family:'Courier New',Courier,monospace;">
              ${escapeHtml(pinVal)}
            </div>
            <div style="font-size:11px;color:#7c2d12;margin-top:6px;">
              Keep this code confidential. Only share verification PINs as instructed in your dashboard.
            </div>
          </td>
        </tr>
      </table>
    `
    : "";

  const categoryLabel =
    template.recipientCategory === "buyer"
      ? "Buyer Notification"
      : template.recipientCategory === "seller"
        ? "Seller / Vendor Notification"
        : "Logistics & Courier Notification";

  const footerComplianceHtml =
    template.classification === "marketing"
      ? `
        <p style="margin:0 0 8px 0;font-size:11px;line-height:1.5;color:#64748b;">
          You are receiving this Shopiversity recommendation/promotional alert because promotional updates are enabled in your account preferences.
        </p>
        <p style="margin:0;font-size:11px;line-height:1.5;color:#64748b;">
          <a href="${escapeHtml(preferencesUrl)}" style="color:#ff6b00;font-weight:700;text-decoration:underline;">Manage Email Preferences</a>
          &nbsp;&bull;&nbsp;
          <a href="${escapeHtml(unsubscribeUrl)}" style="color:#ff6b00;font-weight:700;text-decoration:underline;">Unsubscribe from Promotional Emails</a>
        </p>
      `
      : `
        <p style="margin:0 0 8px 0;font-size:11px;line-height:1.5;color:#64748b;">
          This is an essential transactional notification related to your Shopiversity account activity, order fulfillment, escrow security, or compliance status.
        </p>
        <p style="margin:0;font-size:11px;line-height:1.5;color:#64748b;">
          <a href="${escapeHtml(preferencesUrl)}" style="color:#64748b;text-decoration:underline;">Notification Preferences</a>
          &nbsp;&bull;&nbsp;
          <a href="${escapeHtml(vars.terms_url)}" style="color:#64748b;text-decoration:underline;">Marketplace Terms &amp; Privacy</a>
        </p>
      `;

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${escapeHtml(subject)}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, p, a { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:#f1f5f9;">
    ${escapeHtml(previewText)}
  </div>
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f1f5f9;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden;">
          <!-- Header Branding -->
          <tr>
            <td align="center" style="padding:26px 24px 20px 24px;border-bottom:2px solid #ff6b00;background-color:#ffffff;">
              <img src="${escapeHtml(logoUrl)}" alt="Shopiversity" width="52" height="52" style="display:block;border:0;outline:none;margin:0 auto 10px auto;border-radius:12px;" />
              <div style="font-size:24px;font-weight:900;letter-spacing:-0.5px;color:#ff6b00;line-height:1;">
                shopiversity
              </div>
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.4px;color:#64748b;margin-top:6px;">
                The Marketplace at Your Fingertips &bull; ${escapeHtml(categoryLabel)}
              </div>
            </td>
          </tr>

          <!-- Hero Banner -->
          <tr>
            <td style="padding:20px 24px 0 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#0f172a;border-radius:16px;">
                <tr>
                  <td style="padding:24px;">
                    <span style="display:inline-block;background-color:${escapeHtml(template.badgeColor || "#ff6b00")};color:#ffffff;font-size:10px;font-weight:900;letter-spacing:1px;text-transform:uppercase;padding:5px 12px;border-radius:999px;margin-bottom:12px;">
                      ${escapeHtml(template.badgeLabel)}
                    </span>
                    <h1 style="margin:0;font-size:21px;font-weight:800;line-height:1.3;color:#ffffff;">
                      ${heroTitle}
                    </h1>
                    <p style="margin:6px 0 0 0;font-size:12px;color:#cbd5e1;">
                      Ref: ${escapeHtml(template.code)} &bull; ${escapeHtml(template.section)}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding:24px;">
              <p style="margin:0 0 12px 0;font-size:15px;font-weight:700;color:#0f172a;">
                ${greeting}
              </p>
              ${paragraphsHtml}
              ${pinHtml}
              ${detailRowsHtml}

              <!-- Primary CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:24px 0 12px 0;">
                <tr>
                  <td align="center">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${escapeHtml(ctaUrl)}" style="height:46px;v-text-anchor:middle;width:260px;" arcsize="22%" stroke="f" fillcolor="#ff6b00">
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;">${ctaLabel}</center>
                    </v:roundrect>
                    <![endif]-->
                    <![if !mso]>
                    <a href="${escapeHtml(ctaUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background-color:#ff6b00;color:#ffffff;font-size:14px;font-weight:800;text-decoration:none;padding:13px 28px;border-radius:12px;">
                      ${ctaLabel}
                    </a>
                    <![endif]>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:12px;color:#64748b;text-align:center;">
                Or manage everything from your dashboard:
                <a href="${escapeHtml(dashboardUrl)}" style="color:#ff6b00;font-weight:700;text-decoration:underline;">Open Shopiversity Dashboard</a>
              </p>
            </td>
          </tr>

          <!-- Escrow & Support Strip -->
          <tr>
            <td style="padding:0 24px 20px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
                <tr>
                  <td style="padding:14px 16px;font-size:12px;line-height:1.55;color:#475569;">
                    <strong style="color:#0f172a;">Need help?</strong> Contact Shopiversity Support at
                    <a href="mailto:${escapeHtml(supportEmail)}" style="color:#ff6b00;font-weight:700;text-decoration:none;">${escapeHtml(supportEmail)}</a>.
                    Never share passwords or complete payments off-platform.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:18px 24px 24px 24px;background-color:#f8fafc;border-top:1px solid #e2e8f0;">
              ${footerComplianceHtml}
              <p style="margin:12px 0 0 0;font-size:11px;color:#94a3b8;">
                &copy; ${escapeHtml(vars.year)} Shopiversity Campus Marketplace. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderShopiversityEmailText(
  template: EmailTemplateDefinition,
  rawVariables: EmailVariableMap,
  origin?: string
): string {
  const vars = buildDefaultEmailVariables(
    {
      ...rawVariables,
      recipient_category: template.recipientCategory
    },
    origin
  );

  const subject = interpolateTemplate(template.subjectTemplate, vars);
  const heroTitle = interpolateTemplate(template.heroTitleTemplate, vars);
  const greeting = interpolateTemplate(template.greetingTemplate, vars);
  const ctaUrl = interpolateTemplate(template.ctaUrlTemplate, vars) || vars.dashboard_url;
  const pinVal = template.highlightPinVar ? String(vars[template.highlightPinVar] || "").trim() : "";

  const bodyLines = template.bodyParagraphs.map((p) => interpolateTemplate(p, vars));
  const detailLines = template.detailRows
    .filter((r) => !r.hideIfEmptyVar || Boolean(vars[r.hideIfEmptyVar] && String(vars[r.hideIfEmptyVar]).trim()))
    .map((r) => `- ${r.label}: ${interpolateTemplate(r.valueTemplate, vars)}`);

  return [
    `SHOPIVERSITY (${template.code}) - ${heroTitle}`,
    "=".repeat(48),
    greeting,
    "",
    ...bodyLines,
    pinVal ? `\n${template.highlightPinLabel || "Security Code"}: ${pinVal}` : "",
    detailLines.length ? `\nDetails:\n${detailLines.join("\n")}` : "",
    "",
    `${template.ctaLabel}: ${ctaUrl}`,
    `Dashboard: ${vars.dashboard_url}`,
    `Support: ${vars.support_email}`,
    "",
    template.classification === "marketing"
      ? `Manage preferences / Unsubscribe: ${vars.unsubscribe_url}`
      : `Manage email preferences: ${vars.preferences_url}`,
    `Subject: ${subject}`
  ]
    .filter((line) => line !== undefined)
    .join("\n");
}

export function renderShopiversityEmail(
  template: EmailTemplateDefinition,
  variables: EmailVariableMap,
  origin?: string
): RenderedEmailContent {
  const vars = buildDefaultEmailVariables(
    {
      ...variables,
      recipient_category: template.recipientCategory
    },
    origin
  );

  return {
    subject: interpolateTemplate(template.subjectTemplate, vars),
    previewText: interpolateTemplate(template.previewTextTemplate, vars),
    html: renderShopiversityEmailHtml(template, vars, origin),
    text: renderShopiversityEmailText(template, vars, origin)
  };
}
