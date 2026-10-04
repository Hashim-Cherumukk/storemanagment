import { z } from 'zod';

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: 'Category name must be at least 2 characters' })
    .max(100, { message: 'Category name cannot exceed 100 characters' }),
  description: z.string().trim().max(500).optional(),
  icon: z.string().trim().optional(),
  color: z.string().trim().optional(),
  is_active: z.boolean(),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

export const itemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: 'Item name must be at least 2 characters' })
    .max(150, { message: 'Item name cannot exceed 150 characters' }),
  item_code: z
    .string()
    .trim()
    .min(2, { message: 'Item code must be at least 2 characters' })
    .max(50, { message: 'Item code cannot exceed 50 characters' })
    .regex(/^[A-Za-z0-9-_]+$/, {
      message: 'Item code can only contain alphanumeric characters, hyphens, and underscores',
    }),
  category_id: z.string().min(1, { message: 'Please select a valid category' }),
  description: z.string().trim().max(1000).optional(),
  tracking_type: z.enum(['ASSET', 'STOCK'], {
    message: 'Tracking type must be either ASSET or STOCK',
  }),
  unit: z.enum(['piece', 'set', 'pair', 'box', 'bottle', 'litre', 'kg', 'pack'], {
    message: 'Please select a valid unit of measurement',
  }),
  total_quantity: z.coerce
    .number()
    .int({ message: 'Quantity must be a whole number' })
    .min(0, { message: 'Quantity cannot be negative' }),
  minimum_quantity: z.coerce
    .number()
    .int({ message: 'Minimum threshold must be a whole number' })
    .min(0, { message: 'Minimum quantity cannot be negative' }),
  location: z
    .string()
    .trim()
    .min(2, { message: 'Storage location is required (e.g., Room 102, Shelf B3)' })
    .max(120),
  condition: z.enum(['GOOD', 'FAIR', 'DAMAGED', 'MAINTENANCE', 'RETIRED'], {
    message: 'Please select a valid condition',
  }),
  unit_price: z.coerce.number().min(0, { message: 'Price cannot be negative' }).optional(),
  image_url: z.string().trim().optional(),
  is_active: z.boolean(),
});

export type ItemFormValues = z.infer<typeof itemSchema>;

export const personSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, { message: 'Full name must be at least 2 characters' })
    .max(150),
  admission_number: z.string().trim().max(50).optional(),
  role: z.enum(['STUDENT', 'STAFF', 'TEACHER', 'OTHER'], {
    message: 'Please select an affiliation role',
  }),
  department: z.string().trim().max(100).optional(),
  class_name: z.string().trim().max(50).optional(),
  phone: z.string().trim().max(30).optional(),
  email: z.string().trim().optional(),
  photo_url: z.string().trim().optional(),
  is_active: z.boolean(),
});

export type PersonFormValues = z.infer<typeof personSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email({ message: 'Please enter a valid institutional email' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const institutionSettingsSchema = z.object({
  institution_name: z.string().trim().min(2, { message: 'Institution name is required' }).max(200),
  address: z.string().trim().max(300).optional(),
  phone: z.string().trim().max(40).optional(),
  email: z.string().trim().optional(),
  logo_url: z.string().trim().optional(),
});

export type InstitutionSettingsFormValues = z.infer<typeof institutionSettingsSchema>;
