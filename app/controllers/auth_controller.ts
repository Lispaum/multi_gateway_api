import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { loginValidator } from '#validators/auth_validator'

export default class AuthController {
  async login({ request, response }: HttpContext) {
    const data = await request.validateUsing(loginValidator)

    try {
      const user = await User.verifyCredentials(data.email, data.password)

      const token = await User.accessTokens.create(user)

      return response.ok({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        token: token.value!.release(),
      })
    } catch {
      return response.unauthorized({
        message: 'Invalid credentials',
      })
    }
  }

  async me({ auth, response }: HttpContext) {
    const user = auth.user!
    return response.ok({
      id: user.id,
      email: user.email,
      role: user.role,
    })
  }

  /**
   * POST /logout
   * Informa ao cliente para descartar o token
   * Nota: Em uma implementação real, invalidar o token no servidor
   */
  async logout({ response }: HttpContext) {
    return response.ok({
      message: 'Logged out successfully',
    })
  }
}
