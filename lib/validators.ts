import { z } from 'zod'
import { AssetCategory } from '@prisma/client'

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
})

export const registerSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const assetSchema = z.object({
  name: z
    .string()
    .min(1, 'Asset name is required')
    .max(200, 'Name must be less than 200 characters'),
  category: z.nativeEnum(AssetCategory, {
    errorMap: () => ({ message: 'Please select a valid category' }),
  }),
  currentValue: z
    .number({
      required_error: 'Current value is required',
      invalid_type_error: 'Current value must be a number',
    })
    .min(0, 'Current value cannot be negative'),
  purchasePrice: z
    .number({
      invalid_type_error: 'Purchase price must be a number',
    })
    .min(0, 'Purchase price cannot be negative')
    .optional()
    .nullable(),
  purchaseDate: z
    .string()
    .optional()
    .nullable(),
  currency: z
    .string()
    .min(3, 'Currency code must be 3 characters')
    .max(3, 'Currency code must be 3 characters')
    .default('USD'),
  quantity: z
    .number({
      invalid_type_error: 'Quantity must be a number',
    })
    .positive('Quantity must be positive')
    .optional()
    .nullable(),
  ticker: z
    .string()
    .max(20, 'Ticker must be less than 20 characters')
    .optional()
    .nullable(),
  location: z
    .string()
    .max(500, 'Location must be less than 500 characters')
    .optional()
    .nullable(),
  notes: z
    .string()
    .max(2000, 'Notes must be less than 2000 characters')
    .optional()
    .nullable(),
})

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const userSettingsSchema = z.object({
  currency: z.string().min(3).max(3).optional(),
  alertThreshold: z.number().min(0).max(100).optional(),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type AssetFormData = z.infer<typeof assetSchema>
export type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>
export type UserSettingsFormData = z.infer<typeof userSettingsSchema>
