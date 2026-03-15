/**
 * Interface para serviços de gateway de pagamento
 *
 * Esta interface define o contrato que todos os gateways devem implementar.
 * Isso permite que novos gateways sejam facilmente adicionados ao sistema
 * seguindo o padrão estabelecido.
 *
 * Padrão de Design: Strategy Pattern
 * Cada gateway implementa esta interface, permitindo que o GatewayManager
 * utilize qualquer gateway de forma intercambiável.
 */

export interface TransactionData {
  amount: number
  name: string
  email: string
  cardNumber: string
  cvv: string
}

export interface TransactionResult {
  success: boolean
  externalId?: string
  message?: string
  error?: string
}

export interface RefundResult {
  success: boolean
  message?: string
  error?: string
}

export interface GatewayServiceInterface {
  /**
   * Nome do gateway para identificação
   */
  readonly name: string

  /**
   * Autentica com o gateway (se necessário)
   * Alguns gateways requerem autenticação prévia via token
   */
  authenticate(): Promise<boolean>

  /**
   * Cria uma nova transação de pagamento
   * @param data - Dados da transação (valor, cartão, cliente)
   */
  createTransaction(data: TransactionData): Promise<TransactionResult>

  /**
   * Realiza o reembolso de uma transação
   * @param externalId - ID da transação no gateway
   */
  refund(externalId: string): Promise<RefundResult>
}
