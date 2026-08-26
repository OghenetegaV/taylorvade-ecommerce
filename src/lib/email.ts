// src/lib/email.ts
// Order confirmation emails via Resend (free: 3,000/month)

import { Resend } from "resend";
import prisma from "@/lib/prisma";

const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM   = process.env.RESEND_FROM_EMAIL ?? "orders@taylorvade.com";
// Where new-order alerts go. Unset by default — sendOrderNotificationEmail
// no-ops until STORE_NOTIFICATION_EMAIL is configured.
const STORE_EMAIL = process.env.STORE_NOTIFICATION_EMAIL;

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
            ${item.product.name} — ${item.variant.colorLabel}, ${item.variant.size}
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
            Thank you, ${order.profile.fullName ?? "valued customer"}. Your order has been confirmed.
          </p>

          <div class="label">Order Reference</div>
          <div class="value">#${orderRef}</div>

          <div class="label">Delivery Address</div>
          <div class="value">
            ${order.address.fullName}<br/>
            ${order.address.addressLine1}<br/>
            ${order.address.city}, ${order.address.state}<br/>
            ${order.address.country}
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
          Taylor Vade · Luxury Fashion · orders@taylorvade.com
        </div>
      </div>
    </body>
    </html>
  `;

  await resend.emails.send({
    from: FROM,
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
            ${item.product.name} — ${item.variant.colorLabel}, ${item.variant.size} (${item.variant.sku})
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
              ? ` (discount applied: ${order.discountCode ?? ""} −${order.currency} ${Number(order.discountAmount).toLocaleString()})`
              : ""}
          </p>
          <div style="font-size:11px; letter-spacing:0.1em; color:#8a7a6a; text-transform:uppercase; margin-top:18px;">Customer</div>
          <div style="font-size:13px; color:#1a1008; margin-top:4px;">
            ${order.profile.fullName ?? "—"}<br/>
            ${order.profile.email}<br/>
            ${order.address.phone}
          </div>
          <div style="font-size:11px; letter-spacing:0.1em; color:#8a7a6a; text-transform:uppercase; margin-top:18px;">Delivery Address</div>
          <div style="font-size:13px; color:#1a1008; margin-top:4px;">
            ${order.address.fullName}<br/>
            ${order.address.addressLine1}${order.address.addressLine2 ? `, ${order.address.addressLine2}` : ""}<br/>
            ${order.address.city}, ${order.address.state}<br/>
            ${order.address.country}
          </div>
          <div style="font-size:11px; letter-spacing:0.1em; color:#8a7a6a; text-transform:uppercase; margin-top:18px;">Items</div>
          <table style="width:100%; border-collapse:collapse; margin-top:6px;">
            ${itemRows}
          </table>
          ${order.notes ? `<p style="font-size:12px; color:#5a4a3a; margin-top:16px;">Notes: ${order.notes}</p>` : ""}
        </div>
      </div>
    </body>
    </html>
  `;

  await resend.emails.send({
    from: FROM,
    to: STORE_EMAIL,
    subject: `New Order — #${orderRef} (${order.currency} ${Number(order.totalAmount).toLocaleString()})`,
    html,
  });
}