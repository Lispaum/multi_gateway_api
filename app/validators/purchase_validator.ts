import vine from '@vinejs/vine'

/**
 * Validador para criação de compras
 */
export const purchaseValidator = vine.compile(
  vine.object({
    // Dados do cliente
    client: vine.object({
      name: vine.string().minLength(2).maxLength(255),
      email: vine.string().email(),
    }),
    // Dados do cartão
    card: vine.object({
      cardNumber: vine.string().minLength(13).maxLength(19),
      cvv: vine.string().minLength(3).maxLength(4),
    }),
    // Produtos da compra
    products: vine
      .array(
        vine.object({
          product_id: vine.number().positive(),
          quantity: vine.number().positive().min(1),
        })
      )
      .minLength(1),
  })
)
