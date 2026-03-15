/**
 * Authorization Tests
 *
 * Testes para verificar controle de acesso por roles
 */

import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User, { UserRole } from '#models/user'

test.group('Authorization - Role Based Access', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('ADMIN should access users list', async ({ client }) => {
    const admin = await User.create({
      email: 'test-admin@test.com',
      password: 'password123',
      role: UserRole.ADMIN,
    })

    const response = await client.get('/users').loginAs(admin)
    response.assertStatus(200)
  })

  test('MANAGER should access users list', async ({ client }) => {
    const manager = await User.create({
      email: 'test-manager@test.com',
      password: 'password123',
      role: UserRole.MANAGER,
    })

    const response = await client.get('/users').loginAs(manager)
    response.assertStatus(200)
  })

  test('USER should NOT access users list', async ({ client }) => {
    const user = await User.create({
      email: 'test-user@test.com',
      password: 'password123',
      role: UserRole.USER,
    })

    const response = await client.get('/users').loginAs(user)
    response.assertStatus(403)
    response.assertBodyContains({
      status: 'error',
    })
  })

  test('FINANCE should NOT access users list', async ({ client }) => {
    const finance = await User.create({
      email: 'test-finance@test.com',
      password: 'password123',
      role: UserRole.FINANCE,
    })

    const response = await client.get('/users').loginAs(finance)
    response.assertStatus(403)
  })

  test('ADMIN should access gateways management', async ({ client }) => {
    const admin = await User.create({
      email: 'test-admin@test.com',
      password: 'password123',
      role: UserRole.ADMIN,
    })

    const response = await client.get('/gateways').loginAs(admin)
    response.assertStatus(200)
  })

  test('MANAGER should NOT access gateways management', async ({ client }) => {
    const manager = await User.create({
      email: 'test-manager@test.com',
      password: 'password123',
      role: UserRole.MANAGER,
    })

    const response = await client.get('/gateways').loginAs(manager)
    response.assertStatus(403)
  })

  test('FINANCE should access products', async ({ client }) => {
    const finance = await User.create({
      email: 'test-finance@test.com',
      password: 'password123',
      role: UserRole.FINANCE,
    })

    const response = await client.get('/products').loginAs(finance)
    response.assertStatus(200)
  })

  test('USER should NOT access products management', async ({ client }) => {
    const user = await User.create({
      email: 'test-user@test.com',
      password: 'password123',
      role: UserRole.USER,
    })

    const response = await client.get('/products').loginAs(user)
    response.assertStatus(403)
  })
})
