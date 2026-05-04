<div align="center">

# ⚓ HELM — PM Command Center

**Ferramenta open-source de gestão de projetos ágil**  
Pensada como projeto flagship para portfólio técnico, com foco em práticas modernas de produto, engenharia e DevOps.

[![Status](https://img.shields.io/badge/status-em_desenvolvimento-yellow?style=flat-square)](https://github.com)
[![Stack](https://img.shields.io/badge/stack-Next.js_+_FastAPI-blue?style=flat-square)](https://github.com)
[![License](https://img.shields.io/badge/licença-MIT-green?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)](CONTRIBUTING.md)

</div>

---

## 🎯 O que é o HELM?

O HELM é uma aplicação completa de gestão de projetos no estilo **Jira / Linear**, mas simplificada, open-source e construída de raiz com as melhores práticas de produto e engenharia modernas.

O objetivo não é apenas construir mais um clone de Kanban — é criar uma plataforma que demonstre **pensamento de produto real**, com métricas de performance, automação de workflows, e uma arquitetura escalável de ponta a ponta.

### O que resolve?

| Problema | Solução no HELM |
|---|---|
| Gestão de sprints dispersa | Sprint planner + Kanban com drag & drop |
| Falta de visibilidade de progresso | Burndown chart + velocity tracking |
| Estimativas imprecisas | Motor de estimativas PERT + CLI |
| Trabalho manual com GitHub | Automação de issues, PRs e changelogs |
| Dados presos na ferramenta | Exportação CSV / PDF |

---

## 🧱 Stack Tecnológica

### Frontend
- **Next.js** — SSR, routing e performance de UI
- **Design System custom** — componentes consistentes e reutilizáveis
- **DnD Kit** — drag & drop para o Kanban board

### Backend
- **FastAPI** — API REST de alta performance, fácil de escalar
- **PostgreSQL** — base de dados relacional robusta
- **Prisma ou SQLAlchemy** — ORM (decisão a tomar na Fase 1)

### Auth & Segurança
- **JWT + Refresh Tokens** — autenticação stateless e segura sem complexidade excessiva

### DevOps
- **GitHub Actions** — CI/CD desde o primeiro commit
- **Vercel** — deploy do frontend
- **Railway** — deploy do backend e base de dados

### Extras
- **CLI em Python** — estimativas de tempo via linha de comandos
- **Webhooks** — integrações com serviços externos
- **Exportação CSV / PDF** — dados sempre acessíveis

---

## 🗺️ Roadmap

### ✅ Fase 1 — Fundação `2–3 semanas`
> Criar a base técnica e estrutural sólida do projeto.

- [ ] Mono-repo com Next.js + FastAPI
- [ ] Setup de base de dados (PostgreSQL + ORM)
- [ ] Sistema de autenticação (JWT + refresh tokens)
- [ ] Design system + layout base
- [ ] CI/CD com GitHub Actions
- [ ] README inicial do projeto

---

### 🚧 Fase 2 — Core PM (Sprints) `3–4 semanas`
> Implementar as funcionalidades principais de gestão ágil.

- [ ] Kanban board com drag & drop
- [ ] Modelo de dados para sprints
- [ ] API REST de tarefas (CRUD completo)
- [ ] Sprint planner
- [ ] Timeline / Gantt simplificado
- [ ] Tracking de story points + velocity

---

### 📈 Fase 3 — Analytics `2–3 semanas`
> Introduzir métricas e análise de performance da equipa.

- [ ] Motor de estimativas (PERT)
- [ ] CLI de estimativas em Python
- [ ] Dashboard de velocidade
- [ ] Burndown chart
- [ ] Exportação de dados (CSV / PDF)

---

### 🔁 Fase 4 — Automação GitHub `1–2 semanas`
> Integrar workflows automáticos com GitHub.

- [ ] Auto-close de issues antigas
- [ ] Geração automática de CHANGELOG
- [ ] Alertas de PRs parados
- [ ] Webhooks para notificações
- [ ] Release notes automáticas

---

### 🌍 Fase 5 — Portfólio & Documentação `1–2 semanas`
> Tornar o projeto apresentável, público e impressionante.

- [ ] Landing page pública
- [ ] Demo interativa (vídeo ou GIF)
- [ ] Deploy completo (Vercel + Railway)
- [ ] README completo com badges
- [ ] Blog técnico em MDX (artigos de PM e engenharia)

---

## 💡 Decisões Técnicas

| Decisão | Justificação |
|---|---|
| **Mono-repo** | Consistência entre frontend e backend; deploys mais simples |
| **FastAPI** | Performance, tipagem Python moderna, docs automáticas (OpenAPI) |
| **Next.js** | SSR para SEO e performance, excelente DX |
| **JWT + refresh tokens** | Segurança sólida sem overhead de sessões server-side |
| **CI/CD desde o início** | Força boas práticas e evita dívida técnica |
| **Foco em Analytics** | Diferencia o projeto de simples clones de Kanban |

---

## 🚀 Valor do Projeto

Este projeto demonstra capacidade real de engenharia de produto:

- **Produto end-to-end** — do modelo de dados ao deploy em produção
- **Múltiplas tecnologias integradas** — frontend, backend, base de dados, DevOps
- **Boas práticas de arquitetura** — separação de responsabilidades, CI/CD, testes
- **Pensamento de produto** — não apenas código, mas decisões orientadas ao utilizador
- **Open-source e público** — código aberto, documentação clara, contribuições bem-vindas

---

## 📌 Extensões Futuras

- 👥 **Multi-user / equipas** — workspaces partilhados com permissões
- 🔐 **RBAC** — controlo de acessos granular por role
- 💬 **Integração Slack / Discord** — notificações em tempo real
- 🤖 **ML para estimativas** — modelos preditivos baseados em histórico
- ⚡ **Tempo real (WebSockets)** — atualizações live no Kanban

---

## ❤️ Apoiar o Projeto

Se achares este projeto útil ou interessante, podes contribuir de várias formas:

- ⭐ **Dá uma estrela** no GitHub — ajuda na visibilidade
- 🐛 **Reporta bugs** ou sugere novas features via Issues
- 🤝 **Contribui com código** — PRs são sempre bem-vindos
- 💸 **Apoia financeiramente** via GoFundMe *(link a adicionar)*

> O apoio ajuda a manter o desenvolvimento ativo, melhorar infraestruturas e dedicar mais tempo a novas funcionalidades.

---

<div align="center">

Feito com ☕ e demasiadas horas de trabalho · [Issues](https://github.com) · [Discussions](https://github.com)

</div>
