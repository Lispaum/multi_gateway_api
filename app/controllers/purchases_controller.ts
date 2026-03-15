import type { HttpContext } from '@adonisjs/core/http'
import { purchaseValidator } from '#validators/purchase_validator'
import Client from '#models/client'
import Product from '#models/product'
import Transaction, { TransactionStatus } from '#models/transaction'
import TransactionProduct from '#models/transaction_product'
import GatewayManager from '#services/gateways/gateway_manager'

export default class PurchasesController {
  /**
   * POST /purchases
   *
   * Processa uma nova compra:
   * 1. Valida os dados de entrada
   * 2. Busca/cria o cliente
   * 3. Calcula o valor total baseado nos produtos
   * 4. Processa o pagamento via GatewayManager (com fallback)
   * 5. Salva a transação e produtos associados
   */
  async store({ request, response }: HttpContext) {
    // Valida os dados da requisição
    const data = await request.validateUsing(purchaseValidator)

    // Busca os produtos e calcula o valor total
    const productIds = data.products.map((p) => p.product_id)
    const products = await Product.query().whereIn('id', productIds)

    // Verifica se todos os produtos existem
    if (products.length !== data.products.length) {
      const foundIds = products.map((p) => p.id)
      const missingIds = productIds.filter((id) => !foundIds.includes(id))
      return response.notFound({
        message: 'Some products were not found',
        missing_product_ids: missingIds,
      })
    }

    // Calcula o valor total (preço * quantidade para cada produto)
    let totalAmount = 0
    const productMap = new Map(products.map((p) => [p.id, p]))

    for (const item of data.products) {
      const product = productMap.get(item.product_id)!
      totalAmount += product.amount * item.quantity
    }

    // Arredonda para 2 casas decimais
    totalAmount = Math.round(totalAmount * 100) / 100

    try {
      // Busca ou cria o cliente
      let client = await Client.query().where('email', data.client.email).first()

      if (!client) {
        client = await Client.create({
          name: data.client.name,
          email: data.client.email,
        })
      }

      // Processa o pagamento via GatewayManager
      const gatewayManager = new GatewayManager()
      const paymentResult = await gatewayManager.processPayment({
        amount: totalAmount,
        name: data.client.name,
        email: data.client.email,
        cardNumber: data.card.cardNumber,
        cvv: data.card.cvv,
      })

      // Extrai os últimos 4 dígitos do cartão
      const cardLastNumbers = data.card.cardNumber.slice(-4)

      // Cria a transação no banco
      const transaction = await Transaction.create({
        clientId: client.id,
        gatewayId: paymentResult.success ? paymentResult.gatewayId : null,
        externalId: paymentResult.externalId || null,
        status: paymentResult.success ? TransactionStatus.APPROVED : TransactionStatus.REFUSED,
        amount: totalAmount,
        cardLastNumbers,
      })

      // Cria os registros de transaction_products
      for (const item of data.products) {
        await TransactionProduct.create({
          transactionId: transaction.id,
          productId: item.product_id,
          quantity: item.quantity,
        })
      }

      // Retorna resposta baseada no resultado do pagamento
      if (paymentResult.success) {
        return response.created({
          message: 'Purchase completed successfully',
          transaction: {
            id: transaction.id,
            status: transaction.status,
            amount: transaction.amount,
            external_id: transaction.externalId,
            gateway: paymentResult.gatewayName,
            card_last_numbers: cardLastNumbers,
          },
          client: {
            id: client.id,
            name: client.name,
            email: client.email,
          },
          products: data.products.map((item) => {
            const product = productMap.get(item.product_id)!
            return {
              id: product.id,
              name: product.name,
              unit_price: product.amount,
              quantity: item.quantity,
              subtotal: product.amount * item.quantity,
            }
          }),
          total_amount: totalAmount,
        })
      } else {
        return response.paymentRequired({
          message: 'Payment failed',
          error: paymentResult.error,
          attempted_gateways: paymentResult.attemptedGateways,
          transaction: {
            id: transaction.id,
            status: transaction.status,
          },
        })
      }
    } catch (error) {
      console.error('[PurchasesController] Error:', error)

      return response.internalServerError({
        message: 'An error occurred while processing the purchase',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  // todo: listar compras, listas detalhe de compra
}
