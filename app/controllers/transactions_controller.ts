import type { HttpContext } from '@adonisjs/core/http'
import Transaction, { TransactionStatus } from '#models/transaction'
import { GatewayFactory } from '#services/gateways/gateway_factory'

export default class TransactionsController {
  async index({ response }: HttpContext) {
    const transactions = await Transaction.query()
      .preload('client')
      .preload('gateway')
      .orderBy('created_at', 'desc')

    return response.ok({
      success: true,
      data: transactions,
    })
  }

  async show({ params, response }: HttpContext) {
    const transaction = await Transaction.query()
      .where('id', params.id)
      .preload('client')
      .preload('gateway')
      .preload('products')
      .first()

    if (!transaction) {
      return response.notFound({
        success: false,
        message: 'Transaction not found',
      })
    }

    return response.ok({
      success: true,
      data: transaction,
    })
  }

  /**
   * Realiza reembolso de uma transação
   * POST /transactions/:id/refund
   *
   * Validações:
   * - Transação deve existir
   * - Status deve ser 'approved'
   * - Não pode ser já reembolsada
   * - Deve ter um gateway associado
   */
  async refund({ params, response }: HttpContext) {
    // Busca a transação com o gateway
    const transaction = await Transaction.query().where('id', params.id).preload('gateway').first()

    // Valida que a transação existe
    if (!transaction) {
      return response.notFound({
        success: false,
        message: 'Transaction not found',
      })
    }

    // Valida que não está já reembolsada
    if (transaction.status === TransactionStatus.REFUNDED) {
      return response.badRequest({
        success: false,
        message: 'Transaction has already been refunded',
      })
    }

    // Valida que o status é 'approved'
    if (transaction.status !== TransactionStatus.APPROVED) {
      return response.badRequest({
        success: false,
        message: `Cannot refund transaction with status '${transaction.status}'. Only approved transactions can be refunded.`,
      })
    }

    // Valida que tem gateway e external ID
    if (!transaction.gatewayId || !transaction.externalId) {
      return response.badRequest({
        success: false,
        message: 'Transaction does not have gateway information for refund',
      })
    }

    // Obtém o serviço do gateway correto
    const gatewayService = GatewayFactory.create(transaction.gatewayId)

    if (!gatewayService) {
      return response.internalServerError({
        success: false,
        message: `Gateway service not found for gateway ID ${transaction.gatewayId}`,
      })
    }

    try {
      // Chama o método refund do gateway
      const refundResult = await gatewayService.refund(transaction.externalId)

      if (!refundResult.success) {
        return response.badRequest({
          success: false,
          message: refundResult.error || 'Refund failed at gateway',
        })
      }

      // Atualiza o status da transação para 'refunded'
      transaction.status = TransactionStatus.REFUNDED
      await transaction.save()

      return response.ok({
        success: true,
        message: 'Refund processed successfully',
        data: {
          transactionId: transaction.id,
          gatewayName: gatewayService.name,
          status: transaction.status,
          refundedAt: transaction.updatedAt,
        },
      })
    } catch (error) {
      console.error(`[TransactionsController] Refund error:`, error)
      return response.internalServerError({
        success: false,
        message: 'An error occurred while processing the refund',
      })
    }
  }
}
