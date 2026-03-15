import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { type UserRole } from '#models/user'

/**
 * Middleware de autorização baseado em roles.
 * Verifica se o usuário autenticado possui uma das roles permitidas.
 *
 * Exemplo de uso: middleware(['auth', authorize(['ADMIN', 'MANAGER'])])
 */
export default class AuthorizeMiddleware {
  async handle(ctx: HttpContext, next: NextFn, allowedRoles: string[] = []) {
    const user = ctx.auth.user

    if (!user) {
      return ctx.response.unauthorized({
        status: 'error',
        message: 'Usuário não autenticado',
        code: 'UNAUTHORIZED',
      })
    }

    // Verificar se o usuário tem uma das roles permitidas
    const hasPermission = allowedRoles.some((role) => user.role === (role as UserRole))

    if (!hasPermission) {
      return ctx.response.forbidden({
        status: 'error',
        message: 'Você não tem permissão para acessar este recurso',
        code: 'FORBIDDEN',
        required_roles: allowedRoles,
        your_role: user.role,
      })
    }

    return next()
  }
}
