// src/lib/validations/order.ts

import { z } from "zod";

export const AddressSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(10),
  addressLine1: z.string().min(5),
  addressLine2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  country: z.string().default("Nigeria"),
  postalCode: z.string().optional(),
  isDefault: z.boolean().default(false),
});

export const CheckoutSchema = z.object({
  addressId: z.string().cuid("Invalid address"),
  currency: z.enum(["NGN", "GBP", "USD", "EUR"]).default("NGN"),
  paymentProvider: z.enum(["PAYSTACK", "FLUTTERWAVE"]),
  notes: z.string().max(500).optional(),
});

export type CheckoutInput = z.infer<typeof CheckoutSchema>;
export type AddressInput = z.infer<typeof AddressSchema>;