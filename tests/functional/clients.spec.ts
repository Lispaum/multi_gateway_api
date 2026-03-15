/**
 * Clients Query Tests
 *
 * Testes para consulta de clientes
 */

import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User, { UserRole } from '#models/user'
import Client from '#models/client'

test.group('Clients Query', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('should list all clients', async ({ client }) => {
    const user = await User.create({
      email: 'test-user@test.com',
      password: 'password123',
      role: UserRole.USER,
    })

    await Client.create({ name: 'John Doe', email: 'john@example.com' })
    await Client.create({ name: 'Jane Smith', email: 'jane@example.com' })

    const response = await client.get('/clients').loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({ success: true })
  })

  test('should get client details with transactions', async ({ client }) => {
    const user = await User.create({
      email: 'test-user@test.com',
      password: 'password123',
      role: UserRole.USER,
    })

    const testClient = await Client.create({ name: 'John Doe', email: 'john@example.com' })

    const response = await client.get(`/clients/${testClient.id}`).loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      data: {
        name: 'John Doe',
        email: 'john@example.com',
      },
    })
  })

  test('should return 404 for non-existent client', async ({ client }) => {
    const user = await User.create({
      email: 'test-user@test.com',
      password: 'password123',
      role: UserRole.USER,
    })

    const response = await client.get('/clients/99999').loginAs(user)

    response.assertStatus(404)
    response.assertBodyContains({
      success: false,
    })
  })

  test('should not access clients without authentication', async ({ client }) => {
    const response = await client.get('/clients')

    response.assertStatus(401)
  })
})
