import vine from '@vinejs/vine'
import { UserRole } from '#models/user'

/**
 * Validador para criação de usuário
 */
export const createUserValidator = vine.compile(
  vine.object({
    email: vine.string().email().trim().toLowerCase(),
    password: vine.string().minLength(6).maxLength(100),
    role: vine.enum(Object.values(UserRole)),
  })
)

/**
 * Validador para atualização de usuário
 */
export const updateUserValidator = vine.compile(
  vine.object({
    email: vine.string().email().trim().toLowerCase().optional(),
    password: vine.string().minLength(6).maxLength(100).optional(),
    role: vine.enum(Object.values(UserRole)).optional(),
  })
)
