# Portal HopeXT

Console interno da HopeXT para gerenciar os clientes licenciados do GP Transdata (e futuros
produtos): criar cliente, configurar marca (white-label), acompanhar status comercial (trial,
ativo, inadimplente, bloqueado, cancelado).

Login restrito a contas com o papel `super_admin` no mesmo banco Supabase usado pelo produto.

## Stack

React + Vite + TypeScript + Tailwind + shadcn/ui, reaproveitando o mesmo projeto Supabase do
GP Transdata (mesmo banco, mesma autenticação — só o front-end é uma aplicação separada).

## Desenvolvimento local

```sh
npm i
cp .env.example .env   # preencher com os valores do projeto Supabase
npm run dev
```
