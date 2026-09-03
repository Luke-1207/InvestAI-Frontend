<div align="center">

# 💠 InvestAI Frontend

### Interface Web da Plataforma Inteligente de Investimentos

<br/>

<!-- BADGES -->

![Angular](https://img.shields.io/badge/Angular-19-red?style=for-the-badge&logo=angular)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![SCSS](https://img.shields.io/badge/SCSS-Styling-pink?style=for-the-badge&logo=sass)
![RxJS](https://img.shields.io/badge/RxJS-Reactive-purple?style=for-the-badge&logo=reactivex)

<br/>

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

</div>

---

# 📖 Sobre o Projeto

O **InvestAI Frontend** é a interface web da plataforma InvestAI, consumindo a
[InvestAI API](https://github.com/SEU-USUARIO/InvestAI-API) e apresentando ao usuário:

- 🔐 Autenticação e cadastro
- 🧭 Quiz de onboarding e perfil de investidor
- 📊 Dashboard com indicadores de mercado e sugestões personalizadas por IA
- 📈 Listagem e análise de ativos de Renda Variável
- 💰 Listagem e análise de títulos de Renda Fixa
- ⚖️ Comparação de ativos lado a lado
- 🛠️ Painel administrativo para usuários com papel de Gestor

Construído como Angular standalone (sem NgModules), com roteamento lazy por domínio.

---

# ✨ Preview

> Espaço reservado para screenshots das telas em produção.

---

# ⚙️ Stack Tecnológica

## 🚀 Frontend
- Angular 19 (standalone components)
- TypeScript
- RxJS
- SCSS

## 🧪 Testes
- Karma + Jasmine

## 🐳 Infraestrutura
- Docker (Dockerfile a ser adicionado numa sprint futura)

---

# 📂 Estrutura de Pastas

Organizada por domínio, espelhando os módulos da API:

## 🔐 auth/
Login, cadastro e recuperação de senha.

## 📊 dashboard/
Visão geral do usuário — indicadores de mercado e sugestões personalizadas.

## 📈 renda-variavel/
Listagem e detalhe de ações, FIIs e ETFs.

## 💰 renda-fixa/
Listagem e detalhe de Tesouro Direto e títulos privados.

## 👤 perfil/
Visualização e edição de dados pessoais e perfil de investidor.

## 🛠️ gestor/
Área administrativa, exclusiva de usuários com papel GESTOR.

## 🧩 shared/
Models, services e componentes reutilizados entre domínios.

---

# 🚀 Como Executar o Projeto

# 📋 Pré-requisitos

- Node.js 20+
- Angular CLI (`npm install -g @angular/cli`)
- [InvestAI API](https://github.com/SEU-USUARIO/InvestAI-API) rodando (local ou via
  [InvestAI-Infra](https://github.com/SEU-USUARIO/InvestAI-Infra))

---

# ▶️ Executando o Frontend

## Clone o projeto

```bash
git clone https://github.com/SEU-USUARIO/InvestAI-Frontend.git
```

## Entre na pasta

```bash
cd InvestAI-Frontend
```

## Instale as dependências

```bash
npm install
```

## Execute a aplicação

```bash
ng serve
```

Acesse `http://localhost:4200`.

---

# 👤 Usuário Padrão (Dev/Seed)

O login inicial é o mesmo usuário gestor semeado pela API — veja as credenciais no
[README do InvestAI-API](https://github.com/SEU-USUARIO/InvestAI-API#-usuário-padrão-devseed).
Não duplicamos as credenciais aqui de propósito, pra nunca ficarem desalinhadas entre os
dois repositórios.

---

# 🔧 Configuração de Ambiente

Diferente do backend (que usa variáveis de ambiente via `.env`), o Angular resolve
configuração em tempo de build através dos arquivos em `src/environments/`:

```typescript
// src/environments/environment.development.ts (usado por `ng serve`)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/investai-api/v1',
};
```

Se a API estiver rodando em outro host/porta, ajuste `apiUrl` nesse arquivo.

---

# 📄 Padrões Utilizados

## 🧱 Arquitetura
- Standalone Components (sem NgModules)
- Roteamento lazy por domínio (`loadChildren`)
- Guards funcionais de rota (autenticação e papel de usuário)

## 📚 Convenções
- Um domínio por pasta, espelhando os módulos da API
- Serviços e modelos compartilhados centralizados em `shared/`

---

# 👨‍💻 Autor

<div align="center">

## Lucas Fabiano

### Backend Developer • Java • Spring Boot • Software Architecture

<br/>

<a href="https://github.com/Luke-1207">
  <img src="https://img.shields.io/badge/GitHub-Perfil-black?style=for-the-badge&logo=github"/>
</a>

<a href="https://www.linkedin.com/in/lucas-fabiano-peres-silva-70390424a/">
  <img src="https://img.shields.io/badge/LinkedIn-Perfil-blue?style=for-the-badge&logo=linkedin"/>
</a>

</div>

---

<div align="center">

## 💠 InvestAI Frontend

Interface moderna para uma plataforma inteligente de investimentos.

</div>
