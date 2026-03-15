/**
 * Gateway 1 Service
 *
 * Implementação do serviço de integração com o Gateway 1.
 *
 * Especificações do Gateway 1:
 * - Autenticação: POST /login com email e token, retorna Bearer token
 * - Criar transação: POST /transactions com dados em inglês
 * - Reembolso: POST /transactions/:id/charge_back
 */

import type {
  GatewayServiceInterface,
  TransactionData,
  TransactionResult,
  RefundResult,
} from './gateway_interface.js'
import env from '#start/env'

interface Gateway1LoginResponse {
  token: string
}

interface Gateway1TransactionResponse {
  id?: number | string
  error?: string
}

export default class Gateway1Service implements GatewayServiceInterface {
  readonly name = 'Gateway 1'

  private baseUrl: string
  private email: string
  private token: string
  private bearerToken: string | null = null

  constructor() {
    this.baseUrl = env.get('GATEWAY1_URL', 'http://localhost:3001')
    // this.email = env.get('GATEWAY1_EMAIL', '')
    // this.token = env.get('GATEWAY1_TOKEN', '')
    this.email = env.get('GATEWAY1_EMAIL', 'dev@betalent.tech')
    this.token = env.get('GATEWAY1_TOKEN', 'FEC9BB078BF338F464F96B48089EB498')
  }

  /**
   * Autentica no Gateway 1 via POST /login
   * Recebe um Bearer token para usar nas demais requisições
   */
  async authenticate(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: this.email,
          token: this.token,
        }),
      })

      if (!response.ok) {
        console.error(`[Gateway1] Authentication failed: ${response.status}`)
        return false
      }

      const data = (await response.json()) as Gateway1LoginResponse
      this.bearerToken = data.token
      console.log(`[Gateway1] Authenticated successfully`)
      return true
    } catch (error) {
      console.error(`[Gateway1] Authentication error:`, error)
      return false
    }
  }

  /**
   * Cria uma transação no Gateway 1
   * Payload: { amount, name, email, cardNumber, cvv }
   */
  async createTransaction(data: TransactionData): Promise<TransactionResult> {
    try {
      // Garante que está autenticado
      if (!this.bearerToken) {
        const authenticated = await this.authenticate()

        if (!authenticated) {
          return { success: false, error: 'Failed to authenticate with Gateway 1' }
        }
      }

      const response = await fetch(`${this.baseUrl}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.bearerToken}`,
        },
        body: JSON.stringify({
          amount: data.amount,
          name: data.name,
          email: data.email,
          cardNumber: data.cardNumber,
          //cvv do cartão, ao usar cvv 100 ou 200 vai ser retornado um erro simulando dados inválidos do cartão
          cvv: data.cvv,
        }),
      })

      const result = (await response.json()) as Gateway1TransactionResponse

      if (!response.ok || !result.id || result.error) {
        console.error(`[Gateway1] Transaction failed:`, result)
        return {
          success: false,
          error: result.error || 'Transaction failed at Gateway 1',
        }
      }

      console.log(`[Gateway1] Transaction successful: ${result.id}`)

      return {
        success: true,
        externalId: String(result.id),
        message: 'Transaction processed by Gateway 1',
      }
    } catch (error) {
      console.error(`[Gateway1] Transaction error:`, error)
      return { success: false, error: 'Gateway 1 connection error' }
    }
  }

  /**
   * Realiza reembolso no Gateway 1
   * Endpoint: POST /transactions/:id/charge_back
   */
  async refund(externalId: string): Promise<RefundResult> {
    try {
      if (!this.bearerToken) {
        const authenticated = await this.authenticate()

        if (!authenticated) {
          return { success: false, error: 'Failed to authenticate with Gateway 1' }
        }
      }

      const response = await fetch(`${this.baseUrl}/transactions/${externalId}/charge_back`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.bearerToken}`,
        },
      })

      if (!response.ok) {
        const result = (await response.json()) as { message?: string }
        return { success: false, error: result.message || 'Refund failed' }
      }

      console.log(`[Gateway1] Refund successful for transaction ${externalId}`)
      return { success: true, message: 'Refund processed by Gateway 1' }
    } catch (error) {
      console.error(`[Gateway1] Refund error:`, error)
      return { success: false, error: 'Gateway 1 refund connection error' }
    }
  }
}
