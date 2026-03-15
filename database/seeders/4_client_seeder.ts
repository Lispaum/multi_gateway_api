import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Client from '#models/client'

export default class extends BaseSeeder {
  async run() {
    await Client.createMany([
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
      },
      {
        name: 'Bob Wilson',
        email: 'bob.wilson@example.com',
      },
    ])
  }
}
