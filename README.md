# Multi-Gateway Payment API

<p align="center">
  <img src="https://img.shields.io/badge/AdonisJS-v7-5a45ff?style=for-the-badge&logo=adonisjs" alt="AdonisJS v7"/>
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue?style=for-the-badge&logo=typescript" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker" alt="Docker"/>
  <img src="https://img.shields.io/badge/Tests-50%20Passed-green?style=for-the-badge" alt="Tests"/>
</p>

## 📋 Sobre o Projeto

Sistema de API de pagamentos com suporte a múltiplos gateways e fallback automático. A API permite processar pagamentos através de diferentes gateways de forma transparente, com sistema de prioridades e fallback em caso de falha.

### Principais Funcionalidades

- 🔐 **Autenticação JWT** com tokens de acesso
- 👥 **Sistema de Roles** (ADMIN, MANAGER, FINANCE, USER)
- 💳 **Processamento de Pagamentos** com múltiplos gateways
- 🔄 **Fallback Automático** entre gateways
- 💰 **Sistema de Reembolso** integrado com gateways
- 📊 **Consulta de Transações** e clientes
- ✅ **Validação** completa com VineJS
- 🧪 **Suite de Testes** com 50 testes automatizados

---

## 🛠️ Requisitos do Sistema

- **Node.js** >= 24.x
- **Docker** e **Docker Compose** (para ambiente completo)
- **npm** ou **yarn**

---

## ⚠️ Nota sobre Variáveis de Ambiente

Para facilitar a avaliação deste teste técnico, o arquivo `.env`
está incluído no repositório com valores de desenvolvimento, tal como as variáveis no docker-compose.

**Em produção, este arquivo seria:**

- Adicionado ao `.gitignore`
- Gerenciado via secrets/vault
- Nunca commitado no repositório

## 🚀 Instalação

### Com Docker Compose (Recomendado)

```bash

# Inicie os containers
docker-compose up

# A API estará disponível em http://localhost:3333
```

O Docker Compose irá configurar:

- MySQL 8.0 (porta 3306)
- Gateway Mock 1 (porta 3001)
- Gateway Mock 2 (porta 3002)
- Aplicação AdonisJS (porta 3333)

### Instalação Local

```bash
# Executar os mock gateways
docker run -p 3001:3001 -p 3002:3002 matheusprotzen/gateways-mock

# Abra novo terminal
npm i

# Executar migrações
npx tsx bin/console.ts migration:run

# Executar seeders
npx tsx bin/console.ts db:seed

# Iniciar em modo desenvolvimento
npm run dev
```

---

## 🧪 Executando Testes

```bash
# Executar os mock gateways
docker run -p 3001:3001 -p 3002:3002 matheusprotzen/gateways-mock

# Abra novo terminal
npm i

# Com banco SQLite (recomendado para testes)
npm test
```

A suite de testes contém **50 testes funcionais** cobrindo:

- Autenticação e autorização
- CRUD de usuários, produtos e gateways
- Consulta de clientes e transações
- Sistema de reembolso
- Controle de acesso por roles

---

## 👥 Usuários de Teste

| Email               | Senha    | Role    | Permissões                      |
| ------------------- | -------- | ------- | ------------------------------- |
| admin@example.com   | password | ADMIN   | Acesso total ao sistema         |
| manager@example.com | password | MANAGER | Gerenciar usuários e produtos   |
| finance@example.com | password | FINANCE | Gerenciar produtos e reembolsos |
| user@example.com    | password | USER    | Acesso básico (consultas)       |

---

## 📡 Rotas da API

### Rotas Públicas

#### Health Check

```http
GET /health
```

Retorna o status da API.

#### Login

```http
POST /login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password"
}
```

**Resposta de Sucesso (200):**

```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "role": "ADMIN"
  },
  "token": "oat_..."
}
```

#### Processar Compra

```http
POST /purchases
Content-Type: application/json

{
  "client": {
    "name": "João Silva",
    "email": "joao@email.com"
  },
  "card": {
    "cardNumber": "4111111111111111",
    "cvv": "123"
  },
  "products": [
    { "product_id": 1, "quantity": 2 },
    { "product_id": 2, "quantity": 1 }
  ]
}
```

**Resposta de Sucesso (200):**

```json
{
  "success": true,
  "message": "Payment processed successfully",
  "data": {
    "transactionId": 1,
    "status": "approved",
    "amount": 299.99,
    "gateway": "Gateway 1"
  }
}
```

---

### Rotas Protegidas (Requer Autenticação)

> **Header:** `Authorization: Bearer <token>`

#### Informações do Usuário

```http
GET /me
```

#### Logout

```http
POST /logout
```

---

### Gestão de Usuários (ADMIN, MANAGER)

#### Listar Usuários

```http
GET /users
```

#### Detalhes do Usuário

```http
GET /users/:id
```

#### Criar Usuário

```http
POST /users
Content-Type: application/json

{
  "email": "novo@example.com",
  "password": "senha123",
  "role": "USER"
}
```

#### Atualizar Usuário

```http
PUT /users/:id
Content-Type: application/json

{
  "email": "atualizado@example.com",
  "role": "MANAGER"
}
```

#### Deletar Usuário

```http
DELETE /users/:id
```

---

### Gestão de Produtos (ADMIN, MANAGER, FINANCE)

#### Listar Produtos

```http
GET /products
```

#### Detalhes do Produto

```http
GET /products/:id
```

#### Criar Produto

```http
POST /products
Content-Type: application/json

{
  "name": "Novo Produto",
  "amount": 99.99
}
```

#### Atualizar Produto

```http
PUT /products/:id
Content-Type: application/json

{
  "name": "Nome Atualizado",
  "amount": 149.99
}
```

#### Deletar Produto

```http
DELETE /products/:id
```

---

### Gestão de Gateways (ADMIN)

#### Listar Gateways

```http
GET /gateways
```

#### Ativar/Desativar Gateway

```http
PATCH /gateways/:id/toggle
```

#### Alterar Prioridade

```http
PATCH /gateways/:id/priority
Content-Type: application/json

{
  "priority": 1
}
```

---

### Consulta de Clientes (Todos Autenticados)

#### Listar Clientes

```http
GET /clients
```

#### Detalhes do Cliente (com transações)

```http
GET /clients/:id
```

**Resposta (200):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "João Silva",
    "email": "joao@email.com",
    "transactions": [
      {
        "id": 1,
        "status": "approved",
        "amount": 299.99,
        "gateway": { "name": "Gateway 1" },
        "products": [...]
      }
    ]
  }
}
```

---

### Consulta de Transações (Todos Autenticados)

#### Listar Transações

```http
GET /transactions
```

#### Detalhes da Transação

```http
GET /transactions/:id
```

**Resposta (200):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "approved",
    "amount": 299.99,
    "externalId": "ext_123",
    "cardLastNumbers": "1111",
    "client": { "name": "João Silva", "email": "joao@email.com" },
    "gateway": { "name": "Gateway 1" },
    "products": [{ "name": "Produto A", "quantity": 2 }]
  }
}
```

---

### Reembolso (ADMIN, FINANCE)

#### Realizar Reembolso

```http
POST /transactions/:id/refund
```

**Resposta de Sucesso (200):**

```json
{
  "success": true,
  "message": "Refund processed successfully",
  "data": {
    "transactionId": 1,
    "gatewayName": "Gateway 1",
    "status": "refunded"
  }
}
```

**Erros Possíveis:**

- `404` - Transação não encontrada
- `400` - Transação já reembolsada
- `400` - Status não permite reembolso (apenas "approved")
- `403` - Sem permissão para reembolso

---

## 🔐 Sistema de Roles

| Role        | Permissões                                             |
| ----------- | ------------------------------------------------------ |
| **ADMIN**   | Acesso total: usuários, produtos, gateways, reembolsos |
| **MANAGER** | Gerenciar usuários e produtos                          |
| **FINANCE** | Gerenciar produtos e realizar reembolsos               |
| **USER**    | Consultas (clientes, transações)                       |

---

## 🏗️ Arquitetura de Gateways

O sistema implementa um padrão de **Strategy + Chain of Responsibility** para processamento de pagamentos:

```
┌─────────────────────────────────────────────────────────────┐
│                      GatewayManager                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              processPayment(data)                    │   │
│  │                                                      │   │
│  │  1. Busca gateways ativos ordenados por prioridade  │   │
│  │  2. Para cada gateway:                               │   │
│  │     a. Tenta processar o pagamento                  │   │
│  │     b. Se sucesso → retorna resultado               │   │
│  │     c. Se falha → tenta próximo gateway             │   │
│  │  3. Se todos falharem → retorna erro                │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                │
│              ┌─────────────┴─────────────┐                 │
│              ▼                           ▼                  │
│     ┌─────────────────┐         ┌─────────────────┐        │
│     │  Gateway1Service │         │  Gateway2Service │        │
│     │  (Prioridade 1)  │         │  (Prioridade 2)  │        │
│     │                  │         │                  │        │
│     │ • authenticate() │         │ • authenticate() │        │
│     │ • createTrans()  │         │ • createTrans()  │        │
│     │ • refund()       │         │ • refund()       │        │
│     └─────────────────┘         └─────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### Especificações dos Gateways Mock

| Gateway   | Autenticação                  | Criar Transação    | Reembolso                          |
| --------- | ----------------------------- | ------------------ | ---------------------------------- |
| Gateway 1 | POST /login (Bearer token)    | POST /transactions | POST /transactions/:id/charge_back |
| Gateway 2 | Headers (Auth-Token + Secret) | POST /transacoes   | POST /transacoes/reembolso         |

---

## 🔧 Tecnologias Utilizadas

- **[AdonisJS v7](https://adonisjs.com/)** - Framework web para Node.js
- **[Lucid ORM](https://lucid.adonisjs.com/)** - ORM para bancos de dados
- **[VineJS](https://vinejs.dev/)** - Validação de dados
- **[Japa](https://japa.dev/)** - Framework de testes
- **[TypeScript](https://www.typescriptlang.org/)** - Tipagem estática
- **[MySQL](https://www.mysql.com/)** - Banco de dados em produção
- **[SQLite](https://www.sqlite.org/)** - Banco de dados para testes
- **[Docker](https://www.docker.com/)** - Containerização

---

## 📝 Exemplos com cURL

### Login

```bash
curl -X POST http://localhost:3333/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

### Processar Compra

```bash
curl -X POST http://localhost:3333/purchases \
  -H "Content-Type: application/json" \
  -d '{
    "client": {"name": "João", "email": "joao@email.com"},
    "card": {"cardNumber": "4111111111111111", "cvv": "123"},
    "products": [{"product_id": 1, "quantity": 2}]
  }'
```

### Listar Transações (Autenticado)

```bash
curl -X GET http://localhost:3333/transactions \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### Realizar Reembolso (ADMIN/FINANCE)

```bash
curl -X POST http://localhost:3333/transactions/1/refund \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

---

## 📊 Códigos de Resposta HTTP

| Código | Descrição                |
| ------ | ------------------------ |
| 200    | Sucesso                  |
| 201    | Criado com sucesso       |
| 400    | Erro na requisição       |
| 401    | Não autenticado          |
| 403    | Acesso negado            |
| 404    | Recurso não encontrado   |
| 422    | Erro de validação        |
| 500    | Erro interno do servidor |

---

## 📄 Licença

Este projeto foi desenvolvido como parte de um desafio técnico.

---

<p align="center">
  Desenvolvido com ❤️ usando AdonisJS v7 e Abacus.AI
</p>
