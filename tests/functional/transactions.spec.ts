/**
 * Transactions Query and Refund Tests
 *
 * Testes para consulta e reembolso de transações
 */

import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User, { UserRole } from '#models/user'
import Client from '#models/client'
import Gateway from '#models/gateway'
import Transaction, { TransactionStatus } from '#models/transaction'

test.group('Transactions Query', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('should list all transactions', async ({ client }) => {
    const user = await User.create({
      email: 'test-user@test.com',
      password: 'password123',
      role: UserRole.USER,
    })

    const testClient = await Client.create({ name: 'John Doe', email: 'john@example.com' })
    const gateway = await Gateway.create({ name: 'Gateway 1', isActive: true, priority: 1 })

    await Transaction.create({
      clientId: testClient.id,
      gatewayId: gateway.id,
      externalId: 'ext123',
      status: TransactionStatus.APPROVED,
      amount: 100.0,
      cardLastNumbers: '1234',
    })

    const response = await client.get('/transactions').loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({ success: true })
  })

  test('should get transaction details', async ({ client }) => {
    const user = await User.create({
      email: 'test-user@test.com',
      password: 'password123',
      role: UserRole.USER,
    })

    const testClient = await Client.create({ name: 'John Doe', email: 'john@example.com' })
    const gateway = await Gateway.create({ name: 'Gateway 1', isActive: true, priority: 1 })

    const transaction = await Transaction.create({
      clientId: testClient.id,
      gatewayId: gateway.id,
      externalId: 'ext123',
      status: TransactionStatus.APPROVED,
      amount: 100.0,
      cardLastNumbers: '1234',
    })

    const response = await client.get(`/transactions/${transaction.id}`).loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      data: {
        status: 'approved',
      },
    })
  })

  test('should return 404 for non-existent transaction', async ({ client }) => {
    const user = await User.create({
      email: 'test-user@test.com',
      password: 'password123',
      role: UserRole.USER,
    })

    const response = await client.get('/transactions/99999').loginAs(user)

    response.assertStatus(404)
    response.assertBodyContains({
      success: false,
    })
  })

  test('should not access transactions without authentication', async ({ client }) => {
    const response = await client.get('/transactions')

    response.assertStatus(401)
  })
})

test.group('Transactions Refund', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('ADMIN should have access to refund endpoint', async ({ client, assert }) => {
    const admin = await User.create({
      email: 'test-admin@test.com',
      password: 'password123',
      role: UserRole.ADMIN,
    })

    const testClient = await Client.create({ name: 'John Doe', email: 'john@example.com' })
    const gateway = await Gateway.create({ name: 'Gateway 1', isActive: true, priority: 1 })

    const transaction = await Transaction.create({
      clientId: testClient.id,
      gatewayId: gateway.id,
      externalId: 'ext123',
      status: TransactionStatus.APPROVED,
      amount: 100.0,
      cardLastNumbers: '1234',
    })

    const response = await client.post(`/transactions/${transaction.id}/refund`).loginAs(admin)

    // O teste verifica que o admin tem acesso ao endpoint
    assert.oneOf(response.status(), [200])
  })

  test('FINANCE should have access to refund endpoint', async ({ client, assert }) => {
    const finance = await User.create({
      email: 'test-finance@test.com',
      password: 'password123',
      role: UserRole.FINANCE,
    })

    const testClient = await Client.create({ name: 'John Doe', email: 'john@example.com' })
    const gateway = await Gateway.create({ name: 'Gateway 1', isActive: true, priority: 1 })

    const transaction = await Transaction.create({
      clientId: testClient.id,
      gatewayId: gateway.id,
      externalId: 'ext123',
      status: TransactionStatus.APPROVED,
      amount: 100.0,
      cardLastNumbers: '1234',
    })

    const response = await client.post(`/transactions/${transaction.id}/refund`).loginAs(finance)

    // O teste verifica que o finance tem acesso ao endpoint
    assert.oneOf(response.status(), [200])
  })

  test('should refund on Gateway 2', async ({ client, assert }) => {
    const finance = await User.create({
      email: 'test-finance@test.com',
      password: 'password123',
      role: UserRole.FINANCE,
    })

    const testClient = await Client.create({ name: 'John Doe', email: 'john@example.com' })
    await Gateway.create({ name: 'Gateway 1', isActive: true, priority: 1 })
    const gateway2 = await Gateway.create({ name: 'Gateway 2', isActive: true, priority: 2 })

    const transaction = await Transaction.create({
      clientId: testClient.id,
      gatewayId: gateway2.id,
      externalId: 'ext123',
      status: TransactionStatus.APPROVED,
      amount: 100.0,
      cardLastNumbers: '1234',
    })

    const response = await client.post(`/transactions/${transaction.id}/refund`).loginAs(finance)

    // O teste verifica que o finance tem acesso ao endpoint
    assert.oneOf(response.status(), [200])
  })

  test('USER should NOT be able to refund', async ({ client }) => {
    const user = await User.create({
      email: 'test-user@test.com',
      password: 'password123',
      role: UserRole.USER,
    })

    const testClient = await Client.create({ name: 'John Doe', email: 'john@example.com' })
    const gateway = await Gateway.create({ name: 'Gateway 1', isActive: true, priority: 1 })

    const transaction = await Transaction.create({
      clientId: testClient.id,
      gatewayId: gateway.id,
      externalId: 'ext123',
      status: TransactionStatus.APPROVED,
      amount: 100.0,
      cardLastNumbers: '1234',
    })

    const response = await client.post(`/transactions/${transaction.id}/refund`).loginAs(user)

    response.assertStatus(403)
  })

  test('MANAGER should NOT be able to refund', async ({ client }) => {
    const manager = await User.create({
      email: 'test-manager@test.com',
      password: 'password123',
      role: UserRole.MANAGER,
    })

    const testClient = await Client.create({ name: 'John Doe', email: 'john@example.com' })
    const gateway = await Gateway.create({ name: 'Gateway 1', isActive: true, priority: 1 })

    const transaction = await Transaction.create({
      clientId: testClient.id,
      gatewayId: gateway.id,
      externalId: 'ext123',
      status: TransactionStatus.APPROVED,
      amount: 100.0,
      cardLastNumbers: '1234',
    })

    const response = await client.post(`/transactions/${transaction.id}/refund`).loginAs(manager)

    response.assertStatus(403)
  })

  test('should not refund non-existent transaction', async ({ client }) => {
    const admin = await User.create({
      email: 'test-admin@test.com',
      password: 'password123',
      role: UserRole.ADMIN,
    })

    const response = await client.post('/transactions/99999/refund').loginAs(admin)

    response.assertStatus(404)
    response.assertBodyContains({
      success: false,
      message: 'Transaction not found',
    })
  })

  test('should not refund already refunded transaction', async ({ client }) => {
    const admin = await User.create({
      email: 'test-admin@test.com',
      password: 'password123',
      role: UserRole.ADMIN,
    })

    const testClient = await Client.create({ name: 'John Doe', email: 'john@example.com' })
    const gateway = await Gateway.create({ name: 'Gateway 1', isActive: true, priority: 1 })

    const transaction = await Transaction.create({
      clientId: testClient.id,
      gatewayId: gateway.id,
      externalId: 'ext123',
      status: TransactionStatus.REFUNDED,
      amount: 100.0,
      cardLastNumbers: '1234',
    })

    const response = await client.post(`/transactions/${transaction.id}/refund`).loginAs(admin)

    response.assertStatus(400)
    response.assertBodyContains({
      success: false,
      message: 'Transaction has already been refunded',
    })
  })

  test('should not refund failed transaction', async ({ client }) => {
    const admin = await User.create({
      email: 'test-admin@test.com',
      password: 'password123',
      role: UserRole.ADMIN,
    })

    const testClient = await Client.create({ name: 'John Doe', email: 'john@example.com' })
    const gateway = await Gateway.create({ name: 'Gateway 1', isActive: true, priority: 1 })

    const transaction = await Transaction.create({
      clientId: testClient.id,
      gatewayId: gateway.id,
      externalId: 'ext123',
      status: TransactionStatus.REFUSED,
      amount: 100.0,
      cardLastNumbers: '1234',
    })

    const response = await client.post(`/transactions/${transaction.id}/refund`).loginAs(admin)

    response.assertStatus(400)
    response.assertBodyContains({
      success: false,
    })
  })

  test('should not refund pending transaction', async ({ client }) => {
    const admin = await User.create({
      email: 'test-admin@test.com',
      password: 'password123',
      role: UserRole.ADMIN,
    })

    const testClient = await Client.create({ name: 'John Doe', email: 'john@example.com' })
    const gateway = await Gateway.create({ name: 'Gateway 1', isActive: true, priority: 1 })

    const transaction = await Transaction.create({
      clientId: testClient.id,
      gatewayId: gateway.id,
      externalId: 'ext123',
      status: TransactionStatus.PENDING,
      amount: 100.0,
      cardLastNumbers: '1234',
    })

    const response = await client.post(`/transactions/${transaction.id}/refund`).loginAs(admin)

    response.assertStatus(400)
  })
})
