import type { HttpContext } from '@adonisjs/core/http'
import Client from '#models/client'

export default class ClientsController {
  async index({ response }: HttpContext) {
    const clients = await Client.query().orderBy('id', 'asc')

    return response.ok({
      success: true,
      data: clients,
    })
  }

  async show({ params, response }: HttpContext) {
    const client = await Client.query()
      .where('id', params.id)
      .preload('transactions', (query) => {
        query.preload('gateway').preload('products').orderBy('created_at', 'desc')
      })
      .first()

    if (!client) {
      return response.notFound({
        success: false,
        message: 'Client not found',
      })
    }

    return response.ok({
      success: true,
      data: client,
    })
  }
}
