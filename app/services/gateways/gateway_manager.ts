/**
 * Gateway Manager
 *
 * Gerenciador central de gateways de pagamento.
 *
 * Responsabilidades:
 * 1. Carregar gateways ativos ordenados por prioridade
 * 2. Implementar lógica de fallback automático
 * 3. Tentar processar pagamento em cada gateway até ter sucesso
 *
 * Padrão de Design: Facade + Chain of Responsibility + Strategy + Factory
 *
 * Extensibilidade:
 * Para adicionar um novo gateway:
 * 1. Crie uma classe que implemente GatewayServiceInterface
 * 2. Adicione o gateway no banco de dados
 * 3. Registre o serviço na Factory GatewayFactory
 */

import Gateway from '#models/gateway'
import { GatewayFactory } from './gateway_factory.ts'
import type { TransactionData, TransactionResult } from './gateway_interface.js'

export interface PaymentResult {
  success: boolean
  gatewayId?: number
  gatewayName?: string
  externalId?: string
  error?: string
  attemptedGateways?: string[]
}

export default class GatewayManager {
  /**
   * Busca todos os gateways ativos ordenados por prioridade
   */
  private async getActiveGateways(): Promise<Gateway[]> {
    return Gateway.query().where('is_active', true).orderBy('priority', 'asc')
  }

  /**
   * Processa um pagamento com fallback automático entre gateways.
   *
   * Fluxo:
   * 1. Obtém lista de gateways ativos ordenados por prioridade
   * 2. Para cada gateway:
   *    a. Tenta autenticar (se necessário)
   *    b. Tenta criar a transação
   *    c. Se sucesso, retorna resultado
   *    d. Se falha, loga erro e tenta próximo gateway
   * 3. Se todos falharem, retorna erro com lista de tentativas
   *
   * @param data - Dados da transação
   */
  async processPayment(data: TransactionData): Promise<PaymentResult> {
    const gateways = await this.getActiveGateways()
    const attemptedGateways: string[] = []

    if (gateways.length === 0) {
      return {
        success: false,
        error: 'No active gateways available',
        attemptedGateways,
      }
    }

    console.log(`[GatewayManager] Starting payment processing with ${gateways.length} gateways`)

    // Tenta cada gateway em ordem de prioridade
    for (const gateway of gateways) {
      const service = GatewayFactory.create(gateway.id)

      if (!service) {
        console.warn(
          `[GatewayManager] No service found for gateway ${gateway.id} (${gateway.name})`
        )

        continue
      }

      console.log(
        `[GatewayManager] Attempting payment with ${service.name} (priority: ${gateway.priority})`
      )

      attemptedGateways.push(service.name)

      try {
        // Tenta criar a transação
        const result: TransactionResult = await service.createTransaction(data)

        if (result.success) {
          console.log(`[GatewayManager] Payment successful with ${service.name}`)

          return {
            success: true,
            gatewayId: gateway.id,
            gatewayName: service.name,
            externalId: result.externalId,
            attemptedGateways,
          }
        }

        console.warn(`[GatewayManager] ${service.name} failed: ${result.error}`)
        // Continua para o próximo gateway
      } catch (error) {
        console.error(`[GatewayManager] Error with ${service.name}:`, error)
        // Continua para o próximo gateway
      }
    }

    // Todos os gateways falharam
    console.error(`[GatewayManager] All gateways failed`)

    return {
      success: false,
      error: 'All payment gateways failed',
      attemptedGateways,
    }
  }
}
