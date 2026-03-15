// Criado um factory centralizado

import Gateway1Service from './gateway1_service.ts'
import Gateway2Service from './gateway2_service.ts'
import { type GatewayServiceInterface } from './gateway_interface.ts'

export class GatewayFactory {
  /**
   * Mapa de serviços de gateway.
   * Chave: ID do gateway no banco de dados
   * Valor: Instância do serviço correspondente
   *
   * Para adicionar novos gateways, estenda este campo
   */
  private static gateways: Record<number, new () => GatewayServiceInterface> = {
    1: Gateway1Service,
    2: Gateway2Service,
  }

  static create(gatewayId: number): GatewayServiceInterface | null {
    const Gateway = this.gateways[gatewayId]

    return Gateway ? new Gateway() : null
  }
}
