// src/lib/validations/product.ts

import { z } from "zod";

export const ProductVariantSchema = z.object({
  colorLabel:    z.string().min(1, "Colour label is required"),
  colorHex:      z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  size:          z.string().min(1, "Size is required"),
  stockQuantity: z.number().int().min(0).default(0),
  sku:           z.string().min(1, "SKU is required"),
  priceOverride: z.number().positive().optional(),
});

export const CreateProductSchema = z.object({
  name:        z.string().min(2, "Name must be at least 2 characters"),
  slug:        z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  description: z.string().optional(),
  type:        z.string().min(2, "Type is required (e.g. 'Contrast Raglan Shirt')"),
  basePrice:   z.number().positive("Price must be greater than 0"),
  gender:      z.enum(["MEN", "WOMEN", "UNISEX"]),
  categoryId:  z.string().cuid("Invalid category"),
  isNew:       z.boolean().default(false),
  isFeatured:  z.boolean().default(false),
  isPublished: z.boolean().default(false),
  variants:    z
    .array(ProductVariantSchema)
    .min(1, "At least one variant (colour + size) is required"),
});

export const UpdateProductSchema = CreateProductSchema.partial().extend({
  id: z.string().cuid("Invalid product ID"),
});

export const UpdateStockSchema = z.object({
  variantId:     z.string().cuid(),
  stockQuantity: z.number().int().min(0),
  operation:     z.enum(["set", "increment", "decrement"]).default("set"),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type UpdateStockInput   = z.infer<typeof UpdateStockSchema>;
