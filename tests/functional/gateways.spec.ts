/**
 * Gateways Management Tests
 *
 * Testes para gerenciamento de gateways
 */

import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User, { UserRole } from '#models/user'
import Gateway from '#models/gateway'

test.group('Gateways Management', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('should list all gateways', async ({ client }) => {
    const admin = await User.create({
      email: 'test-admin@test.com',
      password: 'password123',
      role: UserRole.ADMIN,
    })

    await Gateway.create({ name: 'Gateway 1', isActive: true, priority: 1 })
    await Gateway.create({ name: 'Gateway 2', isActive: true, priority: 2 })

    const response = await client.get('/gateways').loginAs(admin)

    response.assertStatus(200)
    response.assertBodyContains({ status: 'success' })
  })

  test('should toggle gateway status', async ({ client }) => {
    const admin = await User.create({
      email: 'test-admin@test.com',
      password: 'password123',
      role: UserRole.ADMIN,
    })

    const gateway = await Gateway.create({ name: 'Gateway 1', isActive: true, priority: 1 })

    const response = await client.patch(`/gateways/${gateway.id}/toggle`).loginAs(admin)

    response.assertStatus(200)
    response.assertBodyContains({
      status: 'success',
      data: { is_active: false },
    })
  })

  test('should update gateway priority', async ({ client }) => {
    const admin = await User.create({
      email: 'test-admin@test.com',
      password: 'password123',
      role: UserRole.ADMIN,
    })

    const gateway = await Gateway.create({ name: 'Gateway 1', isActive: true, priority: 1 })

    const response = await client.patch(`/gateways/${gateway.id}/priority`).loginAs(admin).json({
      priority: 5,
    })

    response.assertStatus(200)
    response.assertBodyContains({
      status: 'success',
      data: { priority: 5 },
    })
  })

  test('should not update gateway with invalid priority', async ({ client }) => {
    const admin = await User.create({
      email: 'test-admin@test.com',
      password: 'password123',
      role: UserRole.ADMIN,
    })

    const gateway = await Gateway.create({ name: 'Gateway 1', isActive: true, priority: 1 })

    const response = await client.patch(`/gateways/${gateway.id}/priority`).loginAs(admin).json({
      priority: -1,
    })

    response.assertStatus(422)
  })
})
