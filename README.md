# HoraCerta - Sistema de Agendamento Online

## Sobre o Projeto

O **HoraCerta** é uma solução web voltada para profissionais autônomos e pequenos estabelecimentos de serviços (barbearias, salões de beleza, consultórios). O sistema automatiza o processo de marcação de horários, eliminando a dependência do agendamento manual por mensagens de chat ou agendas de papel.

### Problema Solucionado

-   **No-Show e Horários Vagos:** Redução de faltas de clientes e lacunas de horários ociosos.
    
-   **Interrupção no Atendimento:** Elimina a necessidade de parar o trabalho para responder mensagens de reagendamento.
    
-   **Choque de Horários:** Prevenção automática de sobreposição de atendimentos no mesmo horário.
    
-   **Desorganização de Registros:** Facilidade na visualização da agenda e histórico dos atendimentos.
    

## Integrantes da Equipe

-   **Michel Vieira**
    
-   **Hugo Braga**
    
-   **Pedro Henrique**
    
-   **Luan Azevedo**
    
-   **Hugo Ferreira**
    

## Tecnologias Utilizadas

-   **Frontend:** HTML5, CSS3 / Tailwind, JavaScript (Mobile-First)
    
-   **Backend:** Node.js, TypeScript, Express, Zod (Validação de Dados) — [`/backend`](./backend)
    
-   **Banco de Dados:** SQLite / PostgreSQL com Prisma ORM e Scripts SQL (`DDL` e `DML` em [`/backend/database`](./backend/database))
    
-   **Gestão de Projeto:** Scrum / Metodologia Ágil (Trello)
    
-   **Modelagem e Protótipos:** UML (Diagramas de Casos de Uso, Classes e DER)
    

## Principais Funcionalidades

-   [x] **RF01 - Gestão de Serviços:** Cadastro, edição e exibição de serviços com duração estimada e preço.
    
-   [x] **RF02 - Agendamento Online:** Formulário público onde o cliente seleciona o profissional, serviço, data e horário disponível.
    
-   [x] **RF03 - Painel Gerencial:** Interface para o prestador acompanhar a grade de horários ocupados e o status dos atendimentos.
    
-   [x] **RF04 - Trava Anti-Conflito:** Bloqueio automático de horários já reservados para evitar choques de agenda.
    
-   [x] **RF05 - Cancelamento:** Permitir o cancelamento da reserva tanto pelo cliente quanto pelo profissional.
    

## Documentação e Modelagem UML

A documentação arquitetural completa do projeto encontra-se nas pastas [`/docs`](./docs) e [`/backend`](./backend/README.md):

1.  **Diagrama de Casos de Uso:** Mapeamento de atores (Cliente e Prestador) e suas interações com o sistema.
    
2.  **Diagrama de Classes e DER:** Estrutura das entidades (`Cliente`, `Profissional`, `Serviço`, `Agendamento`, `BloqueioAgenda`) e seus atributos/métodos.
    
3.  **Protótipos de Interface:** Telas projetadas para seleção de serviços, escolha de horários e dashboard do profissional.
    
4.  **Documentação da API para o Frontend:** Guia completo passo a passo (Tela por Tela) disponível em [`/backend/README.md`](./backend/README.md).
    

## Capturas de Tela / Protótipos

**Tela de Agendamento**

**Painel do Prestador**

## Instruções de Instalação e Execução

### Pré-requisitos
- [Node.js](https://nodejs.org/) (v18 ou superior)

### Passo a Passo (Backend e Banco de Dados)

```bash
# 1. Acessar a pasta do backend
cd backend

# 2. Instalar as dependências
npm install

# 3. Criar as tabelas do banco de dados e popular com os dados iniciais do protótipo
npm run setup

# 4. Iniciar o servidor da API em http://localhost:3333
npm run dev
```

> 💡 **Para a equipe de Frontend:** Consulte o arquivo [`backend/README.md`](./backend/README.md) para ver os exemplos prontos de `fetch` e respostas JSON para cada tela do protótipo!

## Planejamento e Gestão do Projeto

Acompanhe a evolução das tarefas e a divisão de responsabilidades da equipe através do nosso quadro público de gerenciamento:

🔗  [**Acessar Quadro do Trello**](https://trello.com/invite/b/6aea050312bd3bc012008ff9/ATTI7500ebf7a52abb946739eb10ee70cd3aE100B881/meu-quadro-do-trello)
