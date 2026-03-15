import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Product from '#models/product'

export default class extends BaseSeeder {
  async run() {
    await Product.createMany([
      {
        name: 'Product A',
        amount: 100.00,
      },
      {
        name: 'Product B',
        amount: 250.50,
      },
      {
        name: 'Product C',
        amount: 75.99,
      },
      {
        name: 'Premium Product',
        amount: 999.99,
      },
      {
        name: 'Basic Product',
        amount: 29.90,
      },
    ])
  }
}
