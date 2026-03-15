/**
 * Products CRUD Tests
 *
 * Testes para operações CRUD de produtos
 */

import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User, { UserRole } from '#models/user'
import Product from '#models/product'

test.group('Products CRUD', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('should list all products', async ({ client }) => {
    const admin = await User.create({
      email: 'test-admin@test.com',
      password: 'password123',
      role: UserRole.ADMIN,
    })

    await Product.create({ name: 'Product 1', amount: 100.0 })
    await Product.create({ name: 'Product 2', amount: 200.0 })

    const response = await client.get('/products').loginAs(admin)

    response.assertStatus(200)
    response.assertBodyContains({ status: 'success' })
  })

  test('should create a new product', async ({ client }) => {
    const admin = await User.create({
      email: 'test-admin@test.com',
      password: 'password123',
      role: UserRole.ADMIN,
    })

    const response = await client.post('/products').loginAs(admin).json({
      name: 'New Product',
      amount: 150.99,
    })

    response.assertStatus(201)
    response.assertBodyContains({
      status: 'success',
    })
  })

  test('should not create product with negative amount', async ({ client }) => {
    const admin = await User.create({
      email: 'test-admin@test.com',
      password: 'password123',
      role: UserRole.ADMIN,
    })

    const response = await client.post('/products').loginAs(admin).json({
      name: 'Invalid Product',
      amount: -10,
    })

    response.assertStatus(422)
  })

  test('should get product details', async ({ client }) => {
    const admin = await User.create({
      email: 'test-admin@test.com',
      password: 'password123',
      role: UserRole.ADMIN,
    })

    const product = await Product.create({ name: 'Test Product', amount: 99.99 })

    const response = await client.get(`/products/${product.id}`).loginAs(admin)

    response.assertStatus(200)
    response.assertBodyContains({
      status: 'success',
      data: {
        name: 'Test Product',
      },
    })
  })

  test('should return 404 for non-existent product', async ({ client }) => {
    const admin = await User.create({
      email: 'test-admin@test.com',
      password: 'password123',
      role: UserRole.ADMIN,
    })

    const response = await client.get('/products/99999').loginAs(admin)

    response.assertStatus(404)
    response.assertBodyContains({
      status: 'error',
    })
  })

  test('should update product', async ({ client }) => {
    const admin = await User.create({
      email: 'test-admin@test.com',
      password: 'password123',
      role: UserRole.ADMIN,
    })

    const product = await Product.create({ name: 'Old Name', amount: 50.0 })

    const response = await client.put(`/products/${product.id}`).loginAs(admin).json({
      name: 'New Name',
      amount: 75.0,
    })

    response.assertStatus(200)
    response.assertBodyContains({
      status: 'success',
    })
  })

  test('should delete product', async ({ client }) => {
    const admin = await User.create({
      email: 'test-admin@test.com',
      password: 'password123',
      role: UserRole.ADMIN,
    })

    const product = await Product.create({ name: 'To Delete', amount: 25.0 })

    const response = await client.delete(`/products/${product.id}`).loginAs(admin)

    response.assertStatus(200)
    response.assertBodyContains({
      status: 'success',
    })
  })
})
