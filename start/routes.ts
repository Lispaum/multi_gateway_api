import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

// Lazy Import
const AuthController = () => import('#controllers/auth_controller')
const PurchasesController = () => import('#controllers/purchases_controller')
const UsersController = () => import('#controllers/users_controller')
const ProductsController = () => import('#controllers/products_controller')
const GatewaysController = () => import('#controllers/gateways_controller')
const ClientsController = () => import('#controllers/clients_controller')
const TransactionsController = () => import('#controllers/transactions_controller')

// Health check
router.get('/health', () => {
  return {
    status: 'ok',
    message: 'Multi-Gateway Payment API',
    version: '3.0.0',
  }
})

// =============================================
// PUBLIC ROUTES
// =============================================

// Authentication
router.post('/login', [AuthController, 'login'])

// Purchases (public endpoint for processing payments)
router.post('/purchases', [PurchasesController, 'store'])

// =============================================
// PROTECTED ROUTES (require authentication)
// =============================================

router
  .group(() => {
    // User info
    router.get('/me', [AuthController, 'me'])

    // Logout
    router.post('/logout', [AuthController, 'logout'])
  })
  .use(middleware.auth())

// =============================================
// USERS ROUTES - Permissões: ADMIN, MANAGER
// =============================================
router
  .group(() => {
    // GET /users - Listar todos os usuários
    router.get('/', [UsersController, 'index'])

    // GET /users/:id - Detalhes de um usuário
    router.get('/:id', [UsersController, 'show'])

    // POST /users - Criar usuário
    router.post('/', [UsersController, 'store'])

    // PUT /users/:id - Atualizar usuário
    router.put('/:id', [UsersController, 'update'])

    // DELETE /users/:id - Deletar usuário
    router.delete('/:id', [UsersController, 'destroy'])
  })
  .prefix('/users')
  .use([middleware.auth(), middleware.authorize(['ADMIN', 'MANAGER'])])

// =============================================
// PRODUCTS ROUTES - Permissões: ADMIN, MANAGER, FINANCE
// =============================================
router
  .group(() => {
    // GET /products - Listar todos os produtos
    router.get('/', [ProductsController, 'index'])

    // GET /products/:id - Detalhes de um produto
    router.get('/:id', [ProductsController, 'show'])

    // POST /products - Criar produto
    router.post('/', [ProductsController, 'store'])

    // PUT /products/:id - Atualizar produto
    router.put('/:id', [ProductsController, 'update'])

    // DELETE /products/:id - Deletar produto
    router.delete('/:id', [ProductsController, 'destroy'])
  })
  .prefix('/products')
  .use([middleware.auth(), middleware.authorize(['ADMIN', 'MANAGER', 'FINANCE'])])

// =============================================
// GATEWAYS ROUTES - Permissões: ADMIN
// =============================================
router
  .group(() => {
    // GET /gateways - Listar todos os gateways
    router.get('/', [GatewaysController, 'index'])

    // PATCH /gateways/:id/toggle - Ativar/desativar gateway
    router.patch('/:id/toggle', [GatewaysController, 'toggle'])

    // PATCH /gateways/:id/priority - Alterar prioridade do gateway
    router.patch('/:id/priority', [GatewaysController, 'updatePriority'])
  })
  .prefix('/gateways')
  .use([middleware.auth(), middleware.authorize(['ADMIN'])])

// =============================================
// CLIENTS ROUTES - Permissões: Todos autenticados
// =============================================
router
  .group(() => {
    // GET /clients - Listar todos os clientes
    router.get('/', [ClientsController, 'index'])

    // GET /clients/:id - Detalhes do cliente com transações
    router.get('/:id', [ClientsController, 'show'])
  })
  .prefix('/clients')
  .use(middleware.auth())

// =============================================
// TRANSACTIONS ROUTES - Permissões: Todos autenticados
// =============================================
router
  .group(() => {
    // GET /transactions - Listar todas as transações
    router.get('/', [TransactionsController, 'index'])

    // GET /transactions/:id - Detalhes da transação
    router.get('/:id', [TransactionsController, 'show'])
  })
  .prefix('/transactions')
  .use(middleware.auth())

// =============================================
// REFUND ROUTE - Permissões: ADMIN, FINANCE
// =============================================
router
  .group(() => {
    // POST /transactions/:id/refund - Realizar reembolso
    router.post('/transactions/:id/refund', [TransactionsController, 'refund'])
  })
  .use([middleware.auth(), middleware.authorize(['ADMIN', 'FINANCE'])])
