/**
 * Purchases & Gateway Fallback Tests
 *
 * Testes funcionais para o endpoint POST /purchases com foco no
 * sistema de fallback entre gateways de pagamento.
 *
 * Regras dos mocks:
 * - Gateway1: CVV 100 ou 200 → erro (dados inválidos)
 * - Gateway2: CVV 200 ou 300 → erro (dados inválidos)
 *
 * Cenários de fallback:
 * - CVV 123 (válido)  → Gateway1 aceita (prioridade 1), sucesso
 * - CVV 100           → Gateway1 rejeita → fallback Gateway2, sucesso
 * - CVV 300           → Gateway1 aceita (prioridade 1), mas se Gateway2 fosse primeiro, falharia → testamos com prioridade invertida
 * - CVV 200           → Ambos rejeitam → erro
 */

import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Product from '#models/product'
import Gateway from '#models/gateway'

/**
 * Helper: verifica se os gateways mock estão acessíveis
 */
async function checkGatewayHealth(url: string, timeoutMs = 3000): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)
    return response.ok || response.status < 500
  } catch {
    return false
  }
}

test.group('Purchases - Gateway Fallback', (group) => {
  let gatewaysAvailable = false

  group.setup(async () => {
    // Verifica se os gateways mock estão rodando
    const gateway1Url = process.env.GATEWAY1_URL || 'http://localhost:3001'
    const gateway2Url = process.env.GATEWAY2_URL || 'http://localhost:3002'

    const [gw1, gw2] = await Promise.all([
      checkGatewayHealth(gateway1Url),
      checkGatewayHealth(gateway2Url),
    ])

    gatewaysAvailable = gw1 && gw2

    if (!gatewaysAvailable) {
      console.warn(
        '\n⚠️  Gateways mock não estão acessíveis!\n' +
          `   Gateway1 (${gateway1Url}): ${gw1 ? '✅' : '❌'}\n` +
          `   Gateway2 (${gateway2Url}): ${gw2 ? '✅' : '❌'}\n` +
          '   Execute: docker-compose up gateway1 gateway2\n' +
          '   Os testes de fallback serão IGNORADOS.\n'
      )
    }
  })

  group.each.setup(() => testUtils.db().withGlobalTransaction())

  /**
   * Helper para criar dados de compra
   */
  function makePurchase(cvv: string, productId: number) {
    return {
      client: {
        name: 'Test Client',
        email: 'testclient@example.com',
      },
      card: {
        cardNumber: '4111111111111111',
        cvv,
      },
      products: [{ product_id: productId, quantity: 1 }],
    }
  }

  test('gateways should be running before executing fallback tests', async ({ assert }) => {
    assert.isTrue(
      gatewaysAvailable,
      'Gateways mock não estão rodando. Execute: docker-compose up gateway1 gateway2'
    )
  })

  test('should process payment successfully with valid CVV (123) using Gateway1', async ({
    client,
    assert,
  }) => {
    if (!gatewaysAvailable) {
      assert.isTrue(true, 'Gateways não disponíveis - teste ignorado')
      return
    }

    // Cria gateways e produto diretamente (withGlobalTransaction limpa o DB)
    await Gateway.create({ name: 'Gateway 1', isActive: true, priority: 1 })
    await Gateway.create({ name: 'Gateway 2', isActive: true, priority: 2 })
    const product = await Product.create({ name: 'Test Product', amount: 100.0 })

    const response = await client.post('/purchases').json(makePurchase('123', product.id))

    response.assertStatus(201)
    const body = response.body()

    assert.equal(body.message, 'Purchase completed successfully')
    assert.equal(body.transaction.status, 'approved')
    // CVV 123 é válido para ambos - deve usar Gateway 1 (prioridade 1)
    assert.equal(body.transaction.gateway, 'Gateway 1')
  })

  test('should fallback to Gateway2 when Gateway1 fails (CVV 100)', async ({ client, assert }) => {
    if (!gatewaysAvailable) {
      assert.isTrue(true, 'Gateways não disponíveis - teste ignorado')
      return
    }

    // Cria gateways e produto diretamente
    await Gateway.create({ name: 'Gateway 1', isActive: true, priority: 1 })
    await Gateway.create({ name: 'Gateway 2', isActive: true, priority: 2 })
    const product = await Product.create({ name: 'Test Product', amount: 100.0 })

    // CVV 100: Gateway1 rejeita (100 é inválido para GW1), Gateway2 aceita
    const response = await client.post('/purchases').json(makePurchase('100', product.id))

    response.assertStatus(201)
    const body = response.body()

    assert.equal(body.message, 'Purchase completed successfully')
    assert.equal(body.transaction.status, 'approved')
    // Deve ter feito fallback para Gateway 2
    assert.equal(body.transaction.gateway, 'Gateway 2')
  })

  test('should fallback to Gateway1 when Gateway2 fails (CVV 300)', async ({ client, assert }) => {
    if (!gatewaysAvailable) {
      assert.isTrue(true, 'Gateways não disponíveis - teste ignorado')
      return
    }

    // Para testar fallback de Gateway2 → Gateway1, invertemos as prioridades
    // Gateway2 com prioridade 1 (tentado primeiro), Gateway1 com prioridade 2
    await Gateway.create({ name: 'Gateway 2', isActive: true, priority: 1 })
    await Gateway.create({ name: 'Gateway 1', isActive: true, priority: 2 })
    const product = await Product.create({ name: 'Test Product', amount: 100.0 })

    // CVV 300: Gateway2 rejeita (300 é inválido para GW2), Gateway1 aceita
    const response = await client.post('/purchases').json(makePurchase('300', product.id))

    response.assertStatus(201)
    const body = response.body()

    assert.equal(body.message, 'Purchase completed successfully')
    assert.equal(body.transaction.status, 'approved')
    // Deve ter feito fallback para Gateway 1
    assert.equal(body.transaction.gateway, 'Gateway 1')
  })

  test('should fail when all gateways reject (CVV 200)', async ({ client, assert }) => {
    if (!gatewaysAvailable) {
      assert.isTrue(true, 'Gateways não disponíveis - teste ignorado')
      return
    }

    // Cria gateways e produto diretamente
    await Gateway.create({ name: 'Gateway 1', isActive: true, priority: 1 })
    await Gateway.create({ name: 'Gateway 2', isActive: true, priority: 2 })
    const product = await Product.create({ name: 'Test Product', amount: 100.0 })

    // CVV 200: Gateway1 rejeita (200 inválido), Gateway2 rejeita (200 inválido)
    const response = await client.post('/purchases').json(makePurchase('200', product.id))

    // Deve retornar erro - 402 Payment Required
    response.assertStatus(402)
    const body = response.body()

    assert.equal(body.message, 'Payment failed')
    assert.exists(body.error)
    assert.exists(body.attempted_gateways)
    assert.isArray(body.attempted_gateways)
    // Deve ter tentado ambos os gateways
    assert.lengthOf(body.attempted_gateways, 2)
    assert.equal(body.transaction.status, 'refused')
  })
})
