import { z } from "zod";

import {
  emailSchema,
  passwordSchema,
  nameSchema,
  idParamSchema,
} from "./common.schemas";

export const createUserSchema = z.object({
  body: z.object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    role: z.enum(["user", "admin"]).default("user"),
  }),
});

export const updateUserSchema = z.object({
  params: idParamSchema,
  body: z
    .object({
      name: nameSchema.optional(),
      email: emailSchema.optional(),
      role: z.enum(["user", "admin"]).optional(),
      isActive: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided for update",
    }),
});

export const getUserByIdSchema = z.object({
  params: idParamSchema,
});

export const searchUsersSchema = z.object({
  query: z
    .object({
      name: z.string().min(1, "Search term is required").optional(),
      email: z.string().email().optional(),
      role: z.enum(["user", "admin"]).optional(),
      isActive: z.boolean().optional(),
      isVerified: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one search parameter is required",
    }),
});

export const deleteUserSchema = z.object({
  params: idParamSchema,
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type GetUserByIdInput = z.infer<typeof getUserByIdSchema>;
export type SearchUsersInput = z.infer<typeof searchUsersSchema>;
export type DeleteUserInput = z.infer<typeof deleteUserSchema>;