<div align="center">
  <img src="https://raw.githubusercontent.com/jefersonbraine/emolumentos-web/main/public/banner%20-%20site.png" alt="emolumentos-web Banner" width="1920" />

  ![Deployed on Vercel](https://img.shields.io/badge/deployed-Vercel-000000?logo=vercel)
  ![Angular](https://img.shields.io/badge/Angular-standalone-DD0031?logo=angular)
  ![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)
</div>

Calculadora web de emolumentos de cartório do Paraná — a interface visível de um
sistema em três camadas: [`emolumentos-pr`](https://pypi.org/project/emolumentos-pr/)
(o motor, publicado no PyPI) → [`emolumentos-api`](https://github.com/jefersonbraine/emolumentos-api)
(a API, em produção) → este site.

**No ar:** [emolumentos.jefersonbraineleal.dev](https://emolumentos.jefersonbraineleal.dev)

## O que é

Escolhe a natureza do ato, informe os valores, e veja o total decomposto **taxa por
taxa** — antes de assinar. Feita para o dia a dia de cartórios e escritórios de
advocacia no Paraná, com cálculo oficial baseado na Tabela XI do TJPR.

## Funcionalidades

- **Sete naturezas de ato**, todas reconciliadas com o sistema oficial do cartório:
  compra e venda, doação (com/sem usufruto), escritura sem valor, procuração,
  cessão de direitos, declaração e partilha/inventário (com a regra do item X.b —
  100% no bem de maior valor, 80% nos demais — aplicada automaticamente).
- **Estimativa de ITCMD** para doação, com a alíquota vigente e as fontes legais
  citadas (Lei 18.573/2015).
- **Breakdown completo** por bem e no total geral: Emolumentos, Funrejus, Selo,
  Distribuidor, FUNDEP, ISSQN e VRC — com tooltips explicando cada um.
- **Histórico local**, salvo no navegador, sem backend adicional.
- **Exportação em PDF** formatada para A4, com cabeçalho e marca d'água
  personalizáveis (white-label) para quem quiser entregar o orçamento com a
  própria marca.
- **Link compartilhável** — o tipo de ato e os valores viajam pela URL, prontos
  para recalcular do outro lado.
- **Responsivo**, com identidade visual própria (o contorno do Paraná, araucárias,
  e uma estrela pulsando em Cerro Azul — onde este projeto nasceu).

## Como foi construído

- **Angular** (standalone components, signals), consumindo a API via HTTPS.
- **Deploy** na Vercel, com variáveis de ambiente injetadas em tempo de build
  (`scripts/gerar-environment.js`) — a chave da API nunca fica commitada.
- **A API** roda numa VM Oracle Cloud, exposta via **Cloudflare Tunnel** (contorna
  o bloqueio de portas 80/443 comum em contas gratuitas, sem precisar de IP
  público exposto), com CORS restrito a este domínio.

## Rodando localmente

```bash
git clone https://github.com/jefersonbraine/emolumentos-web.git
cd emolumentos-web
npm install
```

Cria `src/environments/environment.ts`:

```ts
export const environment = {
  production: false,
  apiBase: 'https://api-emolumentos.jefersonbraineleal.dev', // ou sua API local
  apiKey: 'SUA_CHAVE_AQUI',
};
```

```bash
npm start
```

Abre em `http://localhost:4200`.

## Ecossistema

| Repositório | O que é |
|---|---|
| [`emolumentos-pr`](https://github.com/jefersonbraine/emolumentos-pr) | Biblioteca Python, publicada no [PyPI](https://pypi.org/project/emolumentos-pr/) |
| [`emolumentos-api`](https://github.com/jefersonbraine/emolumentos-api) | API FastAPI, [documentação interativa](https://api-emolumentos.jefersonbraineleal.dev/docs) |
| `emolumentos-web` | Este repositório — a interface |

## Licença

MIT.

---

Desenvolvido por **Jeferson Braine Leal** — Substituto Legal no Paraná.
