/**
 * Authentication Tests
 *
 * Testes para autenticação e autorização
 */

import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User, { UserRole } from '#models/user'

test.group('Authentication', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('should create user via API and login successfully (no double hashing)', async ({
    client,
    assert,
  }) => {
    // 1. Criar um admin para autenticar nas rotas protegidas
    const admin = await User.create({
      email: 'admin-hash-test@test.com',
      password: 'adminpass',
      role: UserRole.ADMIN,
    })

    // 2. Criar novo usuário via POST /users (rota protegida)
    const newUserPayload = {
      email: 'hashtest-user@test.com',
      password: 'password123',
      role: 'USER',
    }

    const createResponse = await client.post('/users').json(newUserPayload).loginAs(admin)

    createResponse.assertStatus(201)
    createResponse.assertBodyContains({
      status: 'success',
      message: 'Usuário criado com sucesso',
    })

    // 3. Fazer login com o usuário recém-criado usando a senha em texto plano
    const loginResponse = await client.post('/login').json({
      email: newUserPayload.email,
      password: newUserPayload.password,
    })

    loginResponse.assertStatus(200)
    loginResponse.assertBodyContains({ message: 'Login successful' })

    // 4. Verificar que o token foi retornado e é válido
    const loginBody = loginResponse.body()
    assert.exists(loginBody.token, 'Token deve existir na resposta')
    assert.isString(loginBody.token, 'Token deve ser uma string válida')
    assert.isNotEmpty(loginBody.token, 'Token não deve estar vazio')

    // 5. Usar o token para acessar rota protegida /me
    const meResponse = await client.get('/me').header('Authorization', `Bearer ${loginBody.token}`)

    meResponse.assertStatus(200)
    meResponse.assertBodyContains({ email: newUserPayload.email })
  })

  test('should create user, login, update password, and login again with new password', async ({
    client,
    assert,
  }) => {
    // 1. Criar admin para autenticar nas rotas protegidas
    const admin = await User.create({
      email: 'admin-update-test@test.com',
      password: 'adminpass',
      role: UserRole.ADMIN,
    })

    // 2. Criar novo usuário via POST /users
    const newUserPayload = {
      email: 'update-password-test@test.com',
      password: 'password123',
      role: 'USER',
    }

    const createResponse = await client.post('/users').json(newUserPayload).loginAs(admin)

    createResponse.assertStatus(201)
    const createdUser = createResponse.body().data

    // 3. Login com senha original
    const firstLogin = await client.post('/login').json({
      email: newUserPayload.email,
      password: 'password123',
    })

    firstLogin.assertStatus(200)
    firstLogin.assertBodyContains({ message: 'Login successful' })

    const firstToken = firstLogin.body().token
    assert.exists(firstToken, 'Token deve existir no primeiro login')

    // 4. Atualizar senha via PUT /users/:id
    const updatePayload = {
      password: 'newpassword456',
    }

    const updateResponse = await client
      .put(`/users/${createdUser.id}`)
      .json(updatePayload)
      .loginAs(admin)

    updateResponse.assertStatus(200)

    // 5. Login com nova senha deve funcionar
    const secondLogin = await client.post('/login').json({
      email: newUserPayload.email,
      password: 'newpassword456',
    })

    secondLogin.assertStatus(200)
    secondLogin.assertBodyContains({ message: 'Login successful' })

    const secondToken = secondLogin.body().token
    assert.exists(secondToken, 'Token deve existir no segundo login')
    assert.notEqual(firstToken, secondToken, 'Tokens devem ser diferentes')

    // 6. Login com senha antiga deve falhar
    const oldPasswordLogin = await client.post('/login').json({
      email: newUserPayload.email,
      password: 'password123', // Senha antiga
    })

    oldPasswordLogin.assertStatus(401)
  })

  test('should verify password is hashed in database (not stored as plain text)', async ({
    assert,
  }) => {
    // Criar usuário com senha conhecida
    const user = await User.create({
      email: 'hash-verify@test.com',
      password: 'password123',
      role: UserRole.USER,
    })

    // Recarregar do banco para obter o valor persistido
    await user.refresh()

    // A senha no banco NÃO deve ser o texto plano
    assert.notEqual(user.password, 'password123', 'Senha não deve estar armazenada em texto plano')

    // A senha hashada deve ser uma string longa (scrypt gera hashes longos)
    assert.isTrue(user.password.length > 30, 'Senha hashada deve ter comprimento significativo')
  })

  test('should reject login with invalid email', async ({ client }) => {
    const response = await client.post('/login').json({
      email: 'nonexistent@example.com',
      password: 'password123',
    })

    response.assertStatus(401)
  })

  test('should reject login with invalid password', async ({ client }) => {
    await User.create({
      email: 'test-auth@test.com',
      password: 'password123',
      role: UserRole.USER,
    })

    const response = await client.post('/login').json({
      email: 'test-auth@test.com',
      password: 'wrongpassword',
    })

    response.assertStatus(401)
  })

  test('should reject login with invalid email format', async ({ client }) => {
    const response = await client.post('/login').json({
      email: 'invalid-email',
      password: 'password123',
    })

    response.assertStatus(422)
  })

  test('should get current user info when authenticated', async ({ client }) => {
    const user = await User.create({
      email: 'test-auth@test.com',
      password: 'password123',
      role: UserRole.ADMIN,
    })

    const response = await client.get('/me').loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({
      email: 'test-auth@test.com',
      role: 'ADMIN',
    })
  })

  test('should reject access to protected route without token', async ({ client }) => {
    const response = await client.get('/me')

    response.assertStatus(401)
  })

  test('should logout successfully', async ({ client }) => {
    const user = await User.create({
      email: 'test-auth@test.com',
      password: 'password123',
      role: UserRole.USER,
    })

    const response = await client.post('/logout').loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({
      message: 'Logged out successfully',
    })
  })
})
