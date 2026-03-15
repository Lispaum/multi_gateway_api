import vine from '@vinejs/vine'

/**
 * Validador para o login
 */
export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
    password: vine.string().minLength(1),
  })
)
