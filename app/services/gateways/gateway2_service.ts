/**
 * Gateway 2 Service
 *
 * Implementação do serviço de integração com o Gateway 2.
 *
 * Especificações do Gateway 2:
 * - Autenticação: Headers Gateway-Auth-Token e Gateway-Auth-Secret
 * - Criar transação: POST /transacoes com dados em português
 * - Reembolso: POST /transacoes/reembolso com { id }
 *
 * Nota: Este gateway usa nomenclatura em português para campos e endpoints
 */

import type {
  GatewayServiceInterface,
  TransactionData,
  TransactionResult,
  RefundResult,
} from './gateway_interface.js'
import env from '#start/env'

interface Gateway2TransactionResponse {
  id?: number | string
  //
  erros?: Array<{ message: string }>
  statusCode?: number
  //
}

export default class Gateway2Service implements GatewayServiceInterface {
  readonly name = 'Gateway 2'

  private baseUrl: string
  private authToken: string
  private authSecret: string

  constructor() {
    this.baseUrl = env.get('GATEWAY2_URL', 'http://localhost:3002')
    this.authToken = env.get('GATEWAY2_AUTH_TOKEN', 'tk_f2198cc671b5289fa856')
    this.authSecret = env.get('GATEWAY2_AUTH_SECRET', '3d15e8ed6131446ea7e3456728b1211f')
    // this.authToken = env.get('GATEWAY2_AUTH_TOKEN', 'tk_f2198cc671b5289fa856')
    // this.authSecret = env.get('GATEWAY2_AUTH_SECRET', '3d15e8ed6131446ea7e3456728b1211f')
  }

  /**
   * Gateway 2 usa autenticação via headers, não requer login prévio
   */
  async authenticate(): Promise<boolean> {
    // Gateway 2 autentica via headers em cada requisição
    // Não precisa de login prévio
    console.log(`[Gateway2] Using header-based authentication`)
    return true
  }

  /**
   * Headers de autenticação para Gateway 2
   */
  private getAuthHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Gateway-Auth-Token': this.authToken,
      'Gateway-Auth-Secret': this.authSecret,
    }
  }

  /**
   * Cria uma transação no Gateway 2
   * Payload: { valor, nome, email, numeroCartao, cvv }
   */
  async createTransaction(data: TransactionData): Promise<TransactionResult> {
    try {
      const response = await fetch(`${this.baseUrl}/transacoes`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          valor: data.amount,
          nome: data.name,
          email: data.email,
          numeroCartao: data.cardNumber,
          //cvv do cartão, ao usar cvv 200 ou 300 vai ser retornado um erro simulando dados inválidos do cartão
          cvv: data.cvv,
        }),
      })

      const result = (await response.json()) as Gateway2TransactionResponse

      if (!response.ok || !result.id || result?.statusCode === 400) {
        console.error(`[Gateway2] Transaction failed:`, result)
        return {
          success: false,
          error: result.erros?.[0].message || 'Transaction failed at Gateway 2',
        }
      }

      console.log(`[Gateway2] Transaction successful: ${result.id}`)

      return {
        success: true,
        externalId: String(result.id),
        message: 'Transaction processed by Gateway 2',
      }
    } catch (error) {
      console.error(`[Gateway2] Transaction error:`, error)

      return { success: false, error: 'Gateway 2 connection error' }
    }
  }

  /**
   * Realiza reembolso no Gateway 2
   * Endpoint: POST /transacoes/reembolso com { id }
   */
  async refund(externalId: string): Promise<RefundResult> {
    try {
      const response = await fetch(`${this.baseUrl}/transacoes/reembolso`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ id: externalId }),
      })

      if (!response.ok) {
        const result = (await response.json()) as { mensagem?: string; message?: string }
        return { success: false, error: result.mensagem || result.message || 'Refund failed' }
      }

      console.log(`[Gateway2] Refund successful for transaction ${externalId}`)
      return { success: true, message: 'Refund processed by Gateway 2' }
    } catch (error) {
      console.error(`[Gateway2] Refund error:`, error)
      return { success: false, error: 'Gateway 2 refund connection error' }
    }
  }
}
