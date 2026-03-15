import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User, { UserRole } from '#models/user'

export default class extends BaseSeeder {
  async run() {
    await User.createMany([
      {
        email: 'admin@example.com',
        password: 'password',
        role: UserRole.ADMIN,
      },
      {
        email: 'manager@example.com',
        password: 'password',
        role: UserRole.MANAGER,
      },
      {
        email: 'finance@example.com',
        password: 'password',
        role: UserRole.FINANCE,
      },
      {
        email: 'user@example.com',
        password: 'password',
        role: UserRole.USER,
      },
    ])
  }
}
