/**
 * Users CRUD Tests
 *
 * Testes para operações CRUD de usuários
 */

import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User, { UserRole } from '#models/user'

test.group('Users CRUD', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('should list all users', async ({ client }) => {
    const admin = await User.create({
      email: 'test-admin@test.com',
      password: 'password123',
      role: UserRole.ADMIN,
    })

    await User.create({
      email: 'user1-test@test.com',
      password: 'password123',
      role: UserRole.USER,
    })

    const response = await client.get('/users').loginAs(admin)

    response.assertStatus(200)
    response.assertBodyContains({ status: 'success' })
  })

  test('should create a new user', async ({ client }) => {
    const admin = await User.create({
      email: 'test-admin@test.com',
      password: 'password123',
      role: UserRole.ADMIN,
    })

    const response = await client.post('/users').loginAs(admin).json({
      email: 'newtest-user@test.com',
      password: 'password123',
      role: 'USER',
    })

    response.assertStatus(201)
    response.assertBodyContains({
      status: 'success',
    })
  })

  test('should not create user with duplicate email', async ({ client }) => {
    const admin = await User.create({
      email: 'test-admin@test.com',
      password: 'password123',
      role: UserRole.ADMIN,
    })

    await User.create({
      email: 'existing-test@test.com',
      password: 'password123',
      role: UserRole.USER,
    })

    const response = await client.post('/users').loginAs(admin).json({
      email: 'existing-test@test.com',
      password: 'password123',
      role: 'USER',
    })

    response.assertStatus(422)
    response.assertBodyContains({
      status: 'error',
    })
  })

  test('should get user details', async ({ client }) => {
    const admin = await User.create({
      email: 'test-admin@test.com',
      password: 'password123',
      role: UserRole.ADMIN,
    })

    const user = await User.create({
      email: 'test-user@test.com',
      password: 'password123',
      role: UserRole.USER,
    })

    const response = await client.get(`/users/${user.id}`).loginAs(admin)

    response.assertStatus(200)
    response.assertBodyContains({
      status: 'success',
      data: {
        email: 'test-user@test.com',
        role: 'USER',
      },
    })
  })

  test('should return 404 for non-existent user', async ({ client }) => {
    const admin = await User.create({
      email: 'test-admin@test.com',
      password: 'password123',
      role: UserRole.ADMIN,
    })

    const response = await client.get('/users/99999').loginAs(admin)

    response.assertStatus(404)
    response.assertBodyContains({
      status: 'error',
    })
  })

  test('should update user', async ({ client }) => {
    const admin = await User.create({
      email: 'test-admin@test.com',
      password: 'password123',
      role: UserRole.ADMIN,
    })

    const user = await User.create({
      email: 'test-user@test.com',
      password: 'password123',
      role: UserRole.USER,
    })

    const response = await client.put(`/users/${user.id}`).loginAs(admin).json({
      email: 'updated-test@test.com',
      role: 'MANAGER',
    })

    response.assertStatus(200)
    response.assertBodyContains({
      status: 'success',
    })
  })

  test('should delete user', async ({ client }) => {
    const admin = await User.create({
      email: 'test-admin@test.com',
      password: 'password123',
      role: UserRole.ADMIN,
    })

    const user = await User.create({
      email: 'test-user@test.com',
      password: 'password123',
      role: UserRole.USER,
    })

    const response = await client.delete(`/users/${user.id}`).loginAs(admin)

    response.assertStatus(200)
    response.assertBodyContains({
      status: 'success',
    })
  })

  test('should not delete own account', async ({ client }) => {
    const admin = await User.create({
      email: 'test-admin@test.com',
      password: 'password123',
      role: UserRole.ADMIN,
    })

    const response = await client.delete(`/users/${admin.id}`).loginAs(admin)

    response.assertStatus(403)
    response.assertBodyContains({
      status: 'error',
    })
  })
})
