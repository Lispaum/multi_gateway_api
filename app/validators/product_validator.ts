import vine from '@vinejs/vine'

/**
 * Validador para criação de produto
 */
export const createProductValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(255),
    amount: vine.number().positive(),
  })
)

/**
 * Validador para atualização de produto
 */
export const updateProductValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(255).optional(),
    amount: vine.number().positive().optional(),
  })
)
