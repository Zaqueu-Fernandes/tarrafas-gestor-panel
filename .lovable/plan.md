

# Painel do Gestor — Prefeitura Municipal de Tarrafas-CE

## Visão Geral
Sistema web institucional para gestão e acompanhamento de documentos digitalizados da administração municipal, com autenticação própria, controle de acesso por role/status, e módulo de contabilidade com tabelas, gráficos e exportação PDF.

---

## Fase 1 — Configuração e Design System

### Conectar Supabase
- Conectar o projeto Supabase existente (URL + Anon Key fornecidos)
- **Nenhuma migration será criada** — apenas consumir tabelas existentes

### Identidade Visual
- Paleta azul institucional com gradientes leves
- Cabeçalho fixo com logo (ibb.co), título "Painel do Gestor" e subtítulo da prefeitura
- Rodapé fixo com copyright e link WhatsApp clicável
- Ícones com FontAwesome (fa-spin quando necessário)
- Layout responsivo (Desktop, Tablet, Mobile)

---

## Fase 2 — Autenticação e Cadastro

### Tela de Login
- Campos de e-mail e senha com toggle de visibilidade
- Validações com popups: campos vazios, credenciais incorretas, cadastro pendente (status=false)
- Botão "Entrar" com estado de loading ("Logando..." + animação)
- Link para cadastro

### Tela de Cadastro
- Campos: Nome, E-mail (verificação de duplicidade), Telefone (máscara DDD 88 + 9 dígitos), Cargo, Senha
- Ao enviar: inserir na pmt_usuarios com status=false e role=usuario
- Redirecionamento para tela de confirmação

### Tela de Confirmação
- Check verde centralizado + mensagem de "Cadastro pendente de aprovação"
- Botão WhatsApp para suporte + link para voltar ao login

### Proteção de Rotas
- Sessão persistente (localStorage/contexto)
- Usuários com status=false bloqueados
- Rotas admin acessíveis apenas para role=admin
- Redirecionamento automático conforme status/role

---

## Fase 3 — Tela de Boas-Vindas

### Dashboard Inicial
- Título de boas-vindas e descrição da plataforma
- Cards de departamentos vinculados ao usuário (via pmt_usuario_departamentos)
- Departamentos disponíveis: Contabilidade, Licitação, RH, Jurídico, Contas de Governo, Gabinete
- Departamentos não implementados exibirão indicação "Em breve"

---

## Fase 4 — Painel Admin

### Gerenciamento de Usuários (somente role=admin)
- Lista de todos os usuários cadastrados
- Botão para aprovar (alterar status para true)
- Checkboxes de departamentos por usuário
- Botão "Salvar Permissões" (remove antigas e insere novas na pmt_usuario_departamentos)

---

## Fase 5 — Módulo Contabilidade

### Layout
- Menu lateral esquerdo com abas: Digitalização e Análise Financeira
- Barra de filtros horizontal: Data (intervalo/mês-ano), Natureza (toggle), Categoria, Credor, Doc. Caixa, Descrição
- Botão "Limpar Filtros" e link "Sair"

### Aba Digitalização
- Cards de totais dinâmicos: Receitas, Anulação Receitas, Despesas, Anulação Despesas
- Tabela paginada e ordenável com dados da pmt_digitalizacao
- Coluna "Processo" com ícone de olho que abre link em nova aba
- Animação de carregamento e estado vazio

### Aba Análise Financeira
- 4 gráficos reativos aos filtros:
  - Pizza: Despesas por Unidade Gestora
  - Linha: Evolução Mensal
  - Colunas: Receitas vs Despesas
  - Barras horizontais: Top 10 Credores

### Exportação PDF
- Disponível em ambas as abas
- Conteúdo: cabeçalho institucional, filtros aplicados, subtotais, tabela de dados, rodapé

---

## Fora do Escopo (esta versão)
- Telas de: Licitação, RH, Jurídico, Contas de Governo, Gabinete do Prefeito
- Migração para senhas hasheadas (recomendado futuramente)

