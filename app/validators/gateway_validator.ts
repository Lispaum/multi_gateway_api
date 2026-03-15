import vine from '@vinejs/vine'

/**
 * Validador para alteração de prioridade do gateway
 */
export const updatePriorityValidator = vine.compile(
  vine.object({
    priority: vine.number().positive().withoutDecimals(),
  })
)
