// src/types/index.ts
// Shared TypeScript types used across the app

export type ApiResponse<T = null> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type ProductWithDetails = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: string;
  basePrice: number;
  isNew: boolean;
  isFeatured: boolean;
  gender: "MEN" | "WOMEN" | "UNISEX";
  category: { id: string; name: string; slug: string };
  variants: {
    id: string;
    colorLabel: string;
    colorHex: string | null;
    size: string;
    stockQuantity: number;
    sku: string;
    priceOverride: number | null;
  }[];
  images: {
    id: string;
    url: string;
    altText: string | null;
    position: number;
    isPrimary: boolean;
    variantId: string | null;
  }[];
};

export type CartItemWithProduct = {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    basePrice: number;
    images: { url: string; isPrimary: boolean }[];
  };
  variant: {
    id: string;
    colorLabel: string;
    size: string;
    sku: string;
    stockQuantity: number;
    priceOverride: number | null;
  };
};

export type OrderWithItems = {
  id: string;
  status: string;
  totalAmount: number;
  currency: string;
  paymentProvider: string | null;
  paymentStatus: string;
  createdAt: string;
  address: {
    fullName: string;
    addressLine1: string;
    city: string;
    state: string;
    country: string;
  };
  items: {
    id: string;
    quantity: number;
    unitPrice: number;
    total: number;
    product: { name: string; slug: string };
    variant: { colorLabel: string; size: string };
  }[];
};