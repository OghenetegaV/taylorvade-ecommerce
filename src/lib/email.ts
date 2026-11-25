// src/lib/email.ts
// Order emails sent through the store's Gmail account (SMTP + App Password).
// Needs GMAIL_USER and GMAIL_APP_PASSWORD; sends no-op with a warning without them.

import nodemailer, { type Transporter } from "nodemailer";
import prisma from "@/lib/prisma";

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const FROM = `Taylor Vade <${GMAIL_USER}>`;
// Where new-order alerts go. Unset by default — sendOrderNotificationEmail
// no-ops until STORE_NOTIFICATION_EMAIL is configured.
const STORE_EMAIL = process.env.STORE_NOTIFICATION_EMAIL;

let transporter: Transporter | null = null;

async function send({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.warn("[Email] GMAIL_USER / GMAIL_APP_PASSWORD not set — email not sent:", subject);
    return;
  }
  transporter ??= nodemailer.createTransport({
    service: "gmail",
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  });
  await transporter.sendMail({ from: FROM, to, subject, html });
}

/** Customer-supplied text goes into HTML templates, so escape it. */
function esc(value: string | null | undefined): string {
  return (value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Welcome email for new subscribers carrying their personal one-time code. */
export async function sendSubscriberCouponEmail(to: string, code: string, percent: number) {
  const shopUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://taylorvade.com";
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"/></head>
    <body style="font-family: Georgia, serif; background:#f7f5f2; margin:0; padding:0;">
      <div style="max-width:560px; margin:40px auto; background:#ffffff;">
        <div style="background:#1a1008; padding:32px; text-align:center;">
          <h1 style="color:#f7f5f2; font-size:22px; letter-spacing:0.2em; margin:0; font-weight:normal;">TAYLOR VADE</h1>
        </div>
        <div style="padding:40px 36px; text-align:center; color:#1a1008;">
          <p style="font-size:11px; letter-spacing:0.3em; color:#8a7a6a; text-transform:uppercase; margin:0 0 14px;">Welcome to the Vaders</p>
          <p style="font-size:26px; font-style:italic; margin:0 0 12px;">${percent}% off is yours.</p>
          <p style="font-size:14px; color:#5a4a3a; line-height:1.6; margin:0 0 28px;">
            Thank you for signing up. The New Collection drops this December, and you'll hear about it first.
            Here is your personal code, ready to use now.
          </p>
          <div style="display:inline-block; border:1px solid #1a1008; padding:16px 28px; font-size:20px; letter-spacing:0.18em; font-family:'Courier New', monospace;">
            ${esc(code)}
          </div>
          <p style="font-size:12px; color:#8a7a6a; line-height:1.6; margin:20px 0 30px;">
            Enter it at checkout with this email address (${esc(to)}). One use only.
          </p>
          <a href="${esc(shopUrl)}" style="display:inline-block; background:#1a1008; color:#f7f5f2; text-decoration:none; padding:14px 34px; font-size:12px; letter-spacing:0.22em; text-transform:uppercase;">Shop now</a>
        </div>
        <div style="padding:24px 36px; border-top:1px solid #f0eeeb; font-size:11px; color:#8a7a6a; text-align:center;">
          Taylor Vade · Lagos · You're receiving this because you signed up at taylorvade.com.
        </div>
      </div>
    </body>
    </html>
  `;
  await send({ to, subject: `Your ${percent}% off code — Taylor Vade`, html });
}

export async function sendOrderConfirmationEmail(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      profile: true,
      address: true,
      items: {
        include: {
          product: { select: { name: true } },
          variant: { select: { colorLabel: true, size: true } },
        },
      },
    },
  });

  if (!order) throw new Error(`Order ${orderId} not found`);

  const orderRef = order.id.slice(-8).toUpperCase();

  const itemRows = order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0; border-bottom:1px solid #f0eeeb;">
            ${esc(item.product.name)} — ${esc(item.variant.colorLabel)}, ${esc(item.variant.size)}
          </td>
          <td style="padding:8px 0; border-bottom:1px solid #f0eeeb; text-align:right;">
            x${item.quantity}
          </td>
          <td style="padding:8px 0; border-bottom:1px solid #f0eeeb; text-align:right;">
            ${order.currency} ${Number(item.total).toLocaleString()}
          </td>
        </tr>`
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <style>
        body { font-family: Georgia, serif; background: #f7f5f2; margin: 0; padding: 0; }
        .container { max-width: 560px; margin: 40px auto; background: #ffffff; }
        .header { background: #1a1008; padding: 32px; text-align: center; }
        .header h1 { color: #f7f5f2; font-size: 22px; letter-spacing: 0.2em; margin: 0; }
        .body { padding: 36px; }
        .label { font-size: 11px; letter-spacing: 0.15em; color: #8a7a6a; text-transform: uppercase; }
        .value { font-size: 14px; color: #1a1008; margin-top: 4px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; }
        .total { font-size: 15px; font-weight: bold; color: #1a1008; }
        .footer { padding: 24px 36px; border-top: 1px solid #f0eeeb; font-size: 11px; color: #8a7a6a; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>TAYLOR VADE</h1>
        </div>
        <div class="body">
          <p style="font-size:15px; color:#1a1008; margin-bottom:24px;">
            Thank you, ${esc(order.profile.fullName) || "valued customer"}. Your order has been confirmed.
          </p>

          <div class="label">Order Reference</div>
          <div class="value">#${orderRef}</div>

          <div class="label">Delivery Address</div>
          <div class="value">
            ${esc(order.address.fullName)}<br/>
            ${esc(order.address.addressLine1)}<br/>
            ${esc(order.address.city)}, ${esc(order.address.state)}<br/>
            ${esc(order.address.country)}
          </div>

          <div class="label">Items</div>
          <table style="margin-top:8px; margin-bottom:16px;">
            ${itemRows}
            <tr>
              <td colspan="2" style="padding-top:12px;" class="total">Total</td>
              <td style="padding-top:12px; text-align:right;" class="total">
                ${order.currency} ${Number(order.totalAmount).toLocaleString()}
              </td>
            </tr>
          </table>

          <p style="font-size:12px; color:#5a4a3a; margin-top:24px;">
            We will notify you when your order is dispatched.
            If you have any questions, reply to this email.
          </p>
        </div>
        <div class="footer">
          Taylor Vade · Luxury Fashion · ${GMAIL_USER ?? ""}
        </div>
      </div>
    </body>
    </html>
  `;

  await send({
    to: order.profile.email,
    subject: `Order Confirmed — #${orderRef}`,
    html,
  });
}

/** Internal alert to the store when a new order is paid. No-ops until
 * STORE_NOTIFICATION_EMAIL is set. */
export async function sendOrderNotificationEmail(orderId: string) {
  if (!STORE_EMAIL) return;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      profile: true,
      address: true,
      items: {
        include: {
          product: { select: { name: true } },
          variant: { select: { colorLabel: true, size: true, sku: true } },
        },
      },
    },
  });
  if (!order) return;

  const orderRef = order.id.slice(-8).toUpperCase();

  const itemRows = order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:6px 0; border-bottom:1px solid #f0eeeb;">
            ${esc(item.product.name)} — ${esc(item.variant.colorLabel)}, ${esc(item.variant.size)} (${esc(item.variant.sku)})
          </td>
          <td style="padding:6px 0; border-bottom:1px solid #f0eeeb; text-align:right;">x${item.quantity}</td>
          <td style="padding:6px 0; border-bottom:1px solid #f0eeeb; text-align:right;">
            ${order.currency} ${Number(item.total).toLocaleString()}
          </td>
        </tr>`
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"/></head>
    <body style="font-family: Georgia, serif; background:#f7f5f2; margin:0; padding:0;">
      <div style="max-width:560px; margin:40px auto; background:#fff;">
        <div style="background:#1a1008; padding:24px; text-align:center;">
          <h1 style="color:#f7f5f2; font-size:18px; letter-spacing:0.15em; margin:0;">NEW ORDER — #${orderRef}</h1>
        </div>
        <div style="padding:32px;">
          <p style="font-size:13px; color:#1a1008;">
            ${order.currency} ${Number(order.totalAmount).toLocaleString()}
            ${order.discountAmount && Number(order.discountAmount) > 0
              ? ` (discount applied: ${esc(order.discountCode)} −${order.currency} ${Number(order.discountAmount).toLocaleString()})`
              : ""}
          </p>
          <div style="font-size:11px; letter-spacing:0.1em; color:#8a7a6a; text-transform:uppercase; margin-top:18px;">Customer</div>
          <div style="font-size:13px; color:#1a1008; margin-top:4px;">
            ${esc(order.profile.fullName) || "—"}<br/>
            ${esc(order.profile.email)}<br/>
            ${esc(order.address.phone)}
          </div>
          <div style="font-size:11px; letter-spacing:0.1em; color:#8a7a6a; text-transform:uppercase; margin-top:18px;">Delivery Address</div>
          <div style="font-size:13px; color:#1a1008; margin-top:4px;">
            ${esc(order.address.fullName)}<br/>
            ${esc(order.address.addressLine1)}${order.address.addressLine2 ? `, ${esc(order.address.addressLine2)}` : ""}<br/>
            ${esc(order.address.city)}, ${esc(order.address.state)}<br/>
            ${esc(order.address.country)}
          </div>
          <div style="font-size:11px; letter-spacing:0.1em; color:#8a7a6a; text-transform:uppercase; margin-top:18px;">Items</div>
          <table style="width:100%; border-collapse:collapse; margin-top:6px;">
            ${itemRows}
          </table>
          ${order.notes ? `<p style="font-size:12px; color:#5a4a3a; margin-top:16px;">Notes: ${esc(order.notes)}</p>` : ""}
        </div>
      </div>
    </body>
    </html>
  `;

  await send({
    to: STORE_EMAIL,
    subject: `New Order — #${orderRef} (${order.currency} ${Number(order.totalAmount).toLocaleString()})`,
    html,
  });
}