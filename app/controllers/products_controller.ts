import type { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product'
import { createProductValidator, updateProductValidator } from '#validators/product_validator'

export default class ProductsController {
  async index({ response }: HttpContext) {
    const products = await Product.all()

    return response.ok({
      status: 'success',
      data: products.map((product) => ({
        id: product.id,
        name: product.name,
        amount: product.amount,
        created_at: product.createdAt,
        updated_at: product.updatedAt,
      })),
    })
  }

  async show({ params, response }: HttpContext) {
    const product = await Product.find(params.id)

    if (!product) {
      return response.notFound({
        status: 'error',
        message: 'Produto não encontrado',
        code: 'PRODUCT_NOT_FOUND',
      })
    }

    return response.ok({
      status: 'success',
      data: {
        id: product.id,
        name: product.name,
        amount: product.amount,
        created_at: product.createdAt,
        updated_at: product.updatedAt,
      },
    })
  }

  async store({ request, response }: HttpContext) {
    const data = await request.validateUsing(createProductValidator)

    const product = await Product.create({
      name: data.name,
      amount: data.amount,
    })

    return response.created({
      status: 'success',
      message: 'Produto criado com sucesso',
      data: {
        id: product.id,
        name: product.name,
        amount: product.amount,
        created_at: product.createdAt,
        updated_at: product.updatedAt,
      },
    })
  }

  async update({ params, request, response }: HttpContext) {
    const product = await Product.find(params.id)

    if (!product) {
      return response.notFound({
        status: 'error',
        message: 'Produto não encontrado',
        code: 'PRODUCT_NOT_FOUND',
      })
    }

    const data = await request.validateUsing(updateProductValidator)

    // Atualizar campos
    if (data.name !== undefined) product.name = data.name
    if (data.amount !== undefined) product.amount = data.amount

    await product.save()

    return response.ok({
      status: 'success',
      message: 'Produto atualizado com sucesso',
      data: {
        id: product.id,
        name: product.name,
        amount: product.amount,
        created_at: product.createdAt,
        updated_at: product.updatedAt,
      },
    })
  }

  async destroy({ params, response }: HttpContext) {
    const product = await Product.find(params.id)

    if (!product) {
      return response.notFound({
        status: 'error',
        message: 'Produto não encontrado',
        code: 'PRODUCT_NOT_FOUND',
      })
    }

    await product.delete()

    return response.ok({
      status: 'success',
      message: 'Produto deletado com sucesso',
    })
  }
}
