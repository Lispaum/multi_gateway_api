import type { HttpContext } from '@adonisjs/core/http'
import Gateway from '#models/gateway'
import { updatePriorityValidator } from '#validators/gateway_validator'

export default class GatewaysController {
  async index({ response }: HttpContext) {
    const gateways = await Gateway.query().orderBy('priority', 'asc')

    return response.ok({
      status: 'success',
      data: gateways.map((gateway) => ({
        id: gateway.id,
        name: gateway.name,
        is_active: gateway.isActive,
        priority: gateway.priority,
        created_at: gateway.createdAt,
        updated_at: gateway.updatedAt,
      })),
    })
  }

  async toggle({ params, response }: HttpContext) {
    const gateway = await Gateway.find(params.id)

    if (!gateway) {
      return response.notFound({
        status: 'error',
        message: 'Gateway não encontrado',
        code: 'GATEWAY_NOT_FOUND',
      })
    }

    // Toggle do status
    gateway.isActive = !gateway.isActive
    await gateway.save()

    return response.ok({
      status: 'success',
      message: gateway.isActive ? 'Gateway ativado com sucesso' : 'Gateway desativado com sucesso',
      data: {
        id: gateway.id,
        name: gateway.name,
        is_active: gateway.isActive,
        priority: gateway.priority,
        created_at: gateway.createdAt,
        updated_at: gateway.updatedAt,
      },
    })
  }

  async updatePriority({ params, request, response }: HttpContext) {
    const gateway = await Gateway.find(params.id)

    if (!gateway) {
      return response.notFound({
        status: 'error',
        message: 'Gateway não encontrado',
        code: 'GATEWAY_NOT_FOUND',
      })
    }

    const data = await request.validateUsing(updatePriorityValidator)

    gateway.priority = data.priority
    await gateway.save()

    return response.ok({
      status: 'success',
      message: 'Prioridade do gateway atualizada com sucesso',
      data: {
        id: gateway.id,
        name: gateway.name,
        is_active: gateway.isActive,
        priority: gateway.priority,
        created_at: gateway.createdAt,
        updated_at: gateway.updatedAt,
      },
    })
  }
}
