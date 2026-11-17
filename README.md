# Minha Cartinha 💌

Site da cartinha do colégio feito em **Next.js 16 (App Router) + TypeScript**. A criança toca no envelope (ou começa a digitar), a carta sai, ela preenche **nome**, **idade**, **tamanho de roupa**, **número do calçado** e **3 pedidos** e, ao enviar, a carta volta pro envelope, que é selado e sai voando.

## Estrutura

```
app/
  page.tsx                 página da cartinha
  layout.tsx               fontes (next/font) e metadados
  globals.css              todo o visual e as animações
  admin/page.tsx           /admin: área da escola
  api/cartinha/route.ts    POST: recebe e guarda a cartinha
  api/cartinhas/route.ts   GET: lista as cartinhas (pede senha)
components/
  Envelope.tsx             envelope, formulário e animações de abrir/fechar
  Cartinha.tsx             alterna entre o envelope e "Cartinha enviada!"
  Admin.tsx                tabela, busca e download da planilha (CSV)
  Ceu.tsx, efeitos.ts      cenário, estrelinhas e confete
lib/
  validar.ts               regras dos campos (usadas no navegador e na API)
  redis.ts                 acesso ao Upstash Redis (só no servidor)
```

As cartinhas ficam guardadas no **Upstash Redis** (gratuito, conectado pela própria Vercel).

## Rodar no computador

```bash
npm install
npm run dev
```

Para as APIs funcionarem localmente, crie um `.env.local` com as variáveis abaixo (ou rode `npx vercel env pull .env.local` depois de ligar o projeto à Vercel).

| Variável | Para quê |
| --- | --- |
| `KV_REST_API_URL` e `KV_REST_API_TOKEN` | Banco Upstash (a Vercel cria sozinha ao conectar o Upstash) |
| `ADMIN_PASSWORD` | Senha da escola para entrar em `/admin` |

## Subir na Vercel

1. **Criar o projeto**: nesta pasta, rode `npx vercel` (faz login e cria o projeto). Ou suba para o GitHub e importe em vercel.com/new; a Vercel detecta o Next sozinha.
2. **Conectar o banco**: no painel do projeto, vá em **Storage → Create Database → Upstash (Redis)** e conecte ao projeto.
3. **Senha da escola**: em **Settings → Environment Variables**, crie `ADMIN_PASSWORD`.
4. **Publicar**: `npx vercel --prod` (ou *Redeploy* no painel) para as variáveis valerem.

## Personalizar

- Título e frase de abertura: `app/page.tsx`
- Cores: variáveis no topo de `app/globals.css`
- Regras dos campos, todas em `lib/validar.ts`:
  - idade aceita: `IDADE_MIN` / `IDADE_MAX`
  - tamanhos de roupa oferecidos: `TAMANHOS_ROUPA`
  - números de calçado: `CALCADO_MIN` / `CALCADO_MAX`
  - quantidade de pedidos: `QTD_PEDIDOS`
