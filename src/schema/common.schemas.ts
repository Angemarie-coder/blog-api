import { z } from "zod";

// Schema for post title
export const titleSchema = z
  .string()
  .min(1, "Title is required")
  .max(255, "Title must be less than 255 characters")
  .regex(/^[a-zA-Z0-9\s.,!?()-]+$/, "Title can only contain letters, numbers, spaces, and common punctuation (.,!?()-)")
  .transform(val => val.trim());

// Schema for post body
export const bodySchema = z
  .string()
  .min(1, "Body is required")
  .max(10000, "Body must be less than 10,000 characters")
  .regex(/^[a-zA-Z0-9\s.,!?()\[\]{}\-_*#:;@&]+$/, "Body contains invalid characters")
  .transform(val => val.trim());

// Schema for ID parameters
export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID must be a valid number").transform(Number),
});

// Schema for pagination query parameters
export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default("1"),
  limit: z.string().regex(/^\d+$/).transform(Number).default("10"),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

// Schema for email
export const emailSchema = z
  .string()
  .email("Invalid email format")
  .max(100, "Email must be less than 100 characters");

// Schema for password
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(255, "Password must be less than 255 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain at least one lowercase letter, one uppercase letter, and one number"
  );

// Schema for name
export const nameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name must be less than 100 characters")
  .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces");