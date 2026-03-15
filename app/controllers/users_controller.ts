import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { createUserValidator, updateUserValidator } from '#validators/user_validator'

export default class UsersController {
  async index({ response }: HttpContext) {
    const users = await User.all()

    return response.ok({
      status: 'success',
      data: users.map((user) => ({
        id: user.id,
        email: user.email,
        role: user.role,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
      })),
    })
  }

  async show({ params, response }: HttpContext) {
    const user = await User.find(params.id)

    if (!user) {
      return response.notFound({
        status: 'error',
        message: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND',
      })
    }

    return response.ok({
      status: 'success',
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
      },
    })
  }

  async store({ request, response }: HttpContext) {
    const data = await request.validateUsing(createUserValidator)

    // Verificar se email já existe
    const existingUser = await User.findBy('email', data.email)
    if (existingUser) {
      return response.unprocessableEntity({
        status: 'error',
        message: 'Este email já está em uso',
        code: 'EMAIL_ALREADY_EXISTS',
        errors: [{ field: 'email', message: 'Este email já está em uso' }],
      })
    }

    const user = await User.create({
      email: data.email,
      password: data.password,
      role: data.role,
    })

    return response.created({
      status: 'success',
      message: 'Usuário criado com sucesso',
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
      },
    })
  }

  async update({ params, request, response, auth }: HttpContext) {
    const user = await User.find(params.id)

    if (!user) {
      return response.notFound({
        status: 'error',
        message: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND',
      })
    }

    const data = await request.validateUsing(updateUserValidator)

    // Segurança: não permitir que usuário altere sua própria role (exceto ADMIN)
    if (data.role && auth.user?.id === user.id && auth.user?.role !== 'ADMIN') {
      return response.forbidden({
        status: 'error',
        message: 'Você não pode alterar sua própria role',
        code: 'CANNOT_CHANGE_OWN_ROLE',
      })
    }

    // Verificar se email já existe (se estiver sendo alterado)
    if (data.email && data.email !== user.email) {
      const existingUser = await User.findBy('email', data.email)
      if (existingUser) {
        return response.unprocessableEntity({
          status: 'error',
          message: 'Este email já está em uso',
          code: 'EMAIL_ALREADY_EXISTS',
          errors: [{ field: 'email', message: 'Este email já está em uso' }],
        })
      }
    }

    // Atualizar campos
    if (data.email) user.email = data.email
    if (data.role) user.role = data.role
    if (data.password) {
      user.password = data.password
    }

    await user.save()

    return response.ok({
      status: 'success',
      message: 'Usuário atualizado com sucesso',
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
      },
    })
  }

  async destroy({ params, response, auth }: HttpContext) {
    const user = await User.find(params.id)

    if (!user) {
      return response.notFound({
        status: 'error',
        message: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND',
      })
    }

    // Não permitir que usuário delete a si mesmo
    if (auth.user?.id === user.id) {
      return response.forbidden({
        status: 'error',
        message: 'Você não pode deletar sua própria conta',
        code: 'CANNOT_DELETE_OWN_ACCOUNT',
      })
    }

    await user.delete()

    return response.ok({
      status: 'success',
      message: 'Usuário deletado com sucesso',
    })
  }
}
