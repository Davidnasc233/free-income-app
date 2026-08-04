# My Fintech

Aplicativo de controle financeiro pessoal com autenticação, gestão de transações, metas e visualização gráfica de dados.

## Stack

- Angular 20 (standalone components)
- Firebase Authentication
- Cloud Firestore
- Chart.js + ng2-charts
- Bootstrap 5 + ng-bootstrap

## Funcionalidades

- Cadastro e login de usuários (incluindo login social)
- Dashboard com visão geral financeira
- Cadastro e gerenciamento de transações
- Definição e acompanhamento de metas financeiras
- Gráficos de evolução e comparação de receitas/despesas
- Configurações de perfil do usuário

## Pré-requisitos

- Node.js 20+
- npm 10+
- Conta e projeto no Firebase

## Instalação

1. Clone o repositório.
2. Instale as dependências:

```bash
npm install
```

## Configuração de ambiente

1. Copie o arquivo de exemplo:

```bash
copy src\environments\environment.example.ts src\environments\environment.ts
```

2. Preencha o arquivo `src/environments/environment.ts` com:

- `googleClientId` do OAuth 2.0 (Google)
- Chaves do projeto Firebase (`apiKey`, `authDomain`, `projectId`, etc.)

Exemplo (resumo):

```ts
export const environment = {
  production: false,
  googleClientId: "YOUR_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com",
  firebase: {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.firebasestorage.app",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID",
  },
};
```

## Como executar

```bash
npm start
```

Aplicação disponível em `http://localhost:4200`.

## Scripts disponíveis

- `npm start`: inicia o servidor de desenvolvimento
- `npm run build`: gera build de produção
- `npm run watch`: build em modo watch para desenvolvimento
- `npm test`: executa testes unitários (Karma)
- `npm run ai:sync`: atualiza o esqueleto de documentação/agentes via `scripts/generate-skeleton.ts`

## Rotas principais

- `/auth/login`
- `/auth/register`
- `/dashboard`
- `/home`
- `/transactions`
- `/goals`
- `/graphics`
- `/settings`

Rotas protegidas usam `authGuard`, e o fluxo de autenticação usa `guestGuard` para evitar acesso indevido às páginas de login/cadastro.

## Regras do Firestore

As regras em `firestore.rules` restringem acesso por usuário autenticado (`request.auth.uid`) para:

- `users`: leitura/escrita somente do próprio documento
- `transactions`: leitura/criação/edição/remoção apenas dos próprios registros
- `goals`: leitura/criação/edição/remoção apenas dos próprios registros
- `contactMessages`: criação e leitura apenas das próprias mensagens (sem update/delete)

Se alterar regras, publique no Firebase para surtir efeito:

```bash
npx firebase-tools deploy --only firestore:rules --project financial-app-bf30b
```

## Estrutura do projeto

```text
src/
	app/
		features/
			auth/
			dashboard/
			home/
			transactions/
			goals/
			graphics/
			user-settings/
		guards/
		services/
		shared/
	assets/
		styles/
			_variables.css
			_buttons.css
```

## Padrões de UI

- Estilos globais centralizados em `src/assets/styles/_variables.css` e `src/assets/styles/_buttons.css`
- Layout de páginas com utilitários globais como `.fi-page` e `.fi-page--narrow`
- Botões padrão: `.fi-btn--primary`, `.fi-btn--secondary`, `.fi-btn--destructive`

## Deploy e Firebase

O projeto contém `firebase.json` e `firestore.rules` para configuração de regras do banco.

Passos gerais de deploy:

1. Build da aplicação:

```bash
npm run build
```

2. Deploy com Firebase CLI (após `firebase login` e `firebase init`):

```bash
firebase deploy
```

## Testes

Para rodar os testes unitários:

```bash
npm test
```

## Licença

Defina a licença do projeto conforme a política do time/empresa.
