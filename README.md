# Ahifambe

Sistema web de transporte com perfis de administrador, motorista e passageiro. O frontend usa React/Vite e o backend usa Express/MySQL.

## Requisitos

- Node.js 20 ou superior
- npm
- MySQL 8 ou MariaDB compatível

## Instalação

```bash
npm install
npm --prefix backend install
```

Copie `.env.example` para `.env` e `backend/.env.example` para `backend/.env`. Nunca coloque segredos em variáveis `VITE_*`.

Variáveis principais do frontend: `VITE_API_BASE_URL`. Variáveis do backend: `PORT`, `NODE_ENV`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `BCRYPT_SALT_ROUNDS`, `CORS_ORIGINS`, `AUTH_RATE_LIMIT_WINDOW_MS` e `AUTH_RATE_LIMIT_MAX`.

## Base de dados

Para uma instalação nova, execute `backend/database/schema.sql` numa base vazia. O schema novo já aceita `finished`.

### Actualização de bases antigas

Antes de executar uma migration:

1. Pare escritas na aplicação.
2. Faça backup verificado, por exemplo com `mysqldump` e credenciais fornecidas de forma segura pelo ambiente.
3. Confirme que o backup pode ser restaurado.
4. Execute `backend/database/add_trips_finished_status.sql` na base pretendida.
5. Confirme com `SHOW COLUMNS FROM trips LIKE 'status';` que `finished` existe.
6. Teste início e término numa conta autorizada antes de reabrir o sistema.

A migration preserva `scheduled`, `in_progress`, `completed` e `cancelled`. O teste automatizado confirma que pode ser repetida sem perder os estados antigos. Nunca publique código que grave `finished` contra uma base cujo ENUM ainda não o aceite.

## Execução

```bash
npm --prefix backend run dev
npm run dev
```

Produção:

```bash
npm run build
NODE_ENV=production npm --prefix backend start
```

Use HTTPS, uma origem exacta em `CORS_ORIGINS`, um `JWT_SECRET` aleatório e uma conta de base com permissões mínimas. O frontend compilado deve receber `VITE_API_BASE_URL` com a URL HTTPS da API.

## Testes e qualidade

```bash
npm run lint
npm test
npm run test:backend
npm run build
npm audit
npm --prefix backend audit
```

A suite backend cria e elimina `ahifambe_automated_test` por padrão. `TEST_DB_NAME` só é aceite quando contém `test` e nunca pode ser igual a `DB_NAME`. As contas usadas são inteiramente sintéticas e criadas durante a execução; nenhuma password real é incluída no repositório.

Os testes E2E de navegador não estão configurados porque este ambiente não disponibilizou um navegador. Antes da publicação, execute manualmente os fluxos descritos abaixo ou configure Playwright/Cypress com base e contas exclusivamente de teste.

## Perfis

- Administrador: utilizadores, motoristas, rotas, viaturas e monitoria de viagens.
- Motorista: rotas e viaturas próprias, início/término, lotação, localização e pedidos recebidos.
- Passageiro: viagens activas, mapa, pedido de viatura, histórico próprio e feedback.

## Validação manual recomendada

- Administrador: login, criar/editar rota e viatura, consultar viagem activa.
- Motorista: login, seleccionar rota/viatura, iniciar, actualizar lotação/localização e terminar sem depender da geolocalização.
- Passageiro: login, observar marcador, criar pedido e acompanhar estado.
- Responsividade: testar desktop, tablet e telemóvel; tabelas, menus, modais e mapas.
- Segurança: confirmar 401, 403, CORS, sessão expirada e ausência de stacks nas respostas de produção.

## Segredos anteriormente versionados

`backend/.env` foi removido do índice e está ignorado, mas pode existir no histórico antigo. Antes de publicar:

1. Gere e configure um novo `JWT_SECRET`; isto invalida todos os tokens antigos.
2. Altere a password do utilizador MySQL e actualize o ambiente.
3. Verifique outras credenciais que tenham estado no ficheiro.
4. Avalie com toda a equipa uma limpeza do histórico. Não faça force push sem coordenação e backup.

## Limitações conhecidas

- A base configurada localmente pode ainda precisar da migration `finished`.
- Cancelamento de pedidos do passageiro não existe no ENUM actual.
- Cancelamento/finalização administrativa não foi criado por falta de campos de auditoria.
- Tiles do mapa dependem do OpenStreetMap e de conectividade externa.
- Validação visual/E2E deve ser concluída num ambiente com navegador.

## Problemas comuns

- `JWT_SECRET is required`: configure um segredo no `backend/.env`.
- Erro CORS: inclua a origem exacta do frontend em `CORS_ORIGINS`.
- Frontend sem API: configure `VITE_API_BASE_URL`, incluindo `/api`.
- Erro ao terminar viagem: confirme que a migration `finished` foi aplicada.
- Teste recusa a base: escolha um `TEST_DB_NAME` contendo `test` e diferente de `DB_NAME`.