# Grafana K6 Performance Testing

## GitHub Actions

[![K6 Performance Testing](https://github.com/Isaac-Alexsander/isaac-alexsander-prova04-k6/actions/workflows/node.js.yml/badge.svg)](https://github.com/Isaac-Alexsander/isaac-alexsander-prova04-k6/actions/workflows/node.js.yml)

## Teste da Prova 04

Teste de performance com k6 contra a API da prova 02:
<https://api-prova02-isaacalexsander.onrender.com>

O cenário (`src/tests/Tests.spec.js`) exercita `GET /items` (com `limit`/`skip`),
`GET /items/:id`, `POST /items` e `PUT /items/:id`.

**Rampa (stages):** inicia com 7 VUs, sobe até o máximo de 92 VUs e volta a 0,
com duração total de 3,5 minutos (30s + 45s + 45s + 60s + 30s = 210s).

**Thresholds:**

- `http_req_duration: p(90)<6800` (90% das respostas abaixo de 6800ms)
- `http_req_failed: rate<0.25` (menos de 25% das requisições com erro)

Como a API está no Render free tier e hiberna após inatividade, o workflow faz um
warm-up no `/health` antes de rodar o k6.

## Getting Started

In order to execute this project you must follow the steps below:

1. Install [Node JS](https://nodejs.org/) (version >= 22.x)
1. Install [Grafana K6](https://dl.k6.io/msi/k6-latest-amd64.msi)
1. Run `npm i --save-dev` to install all the project dependencies
1. Run `npm run ci` to execute the entire test suite

All execution reports can be found in `src/output`.