# Documentação de Engenharia de Requisitos — HoraCerta

Este documento apresenta o levantamento, a especificação e o status de implementação dos requisitos do sistema de agendamentos **HoraCerta**.

---

## 1. Visão Geral e Objetivo do Levantamento

O levantamento de requisitos teve como objetivo mapear as necessidades operacionais de pequenos estabelecimentos de serviços (como barbearias, salões de beleza e consultórios) e profissionais autônomos, traduzindo os problemas do agendamento manual (choques de horários, *no-show*, interrupções constantes no atendimento e falta de histórico) em funcionalidades de software claras, testáveis e rastreáveis.

### 1.1 Técnica de Elicitação Utilizada
* **Observação Direta e Análise de Processos:** Avaliação do fluxo tradicional de atendimento via aplicativos de mensagens e agendas físicas em pequenos negócios locais.
* **Brainstorming da Equipe:** Mapeamento das dores dos usuários finais e definição do escopo mínimo viável (MVP) alinhado ao cronograma da disciplina.

---

## 2. Identificação dos Stakeholders

| Stakeholder | Perfil / Papel | Principais Interesses e Necessidades |
| :--- | :--- | :--- |
| **Cliente (Usuário Final)** | Consumidor que deseja agendar um serviço. | Visualizar serviços disponíveis, escolher o profissional de preferência, consultar datas/horários livres de forma rápida pelo celular e cancelar reservas caso necessário. |
| **Profissional / Prestador** | Dono do estabelecimento ou prestador de serviço autônomo. | Gerenciar catálogo de serviços (preço e duração), acompanhar a agenda diária/semanal, bloquear horários indisponíveis, evitar conflitos de marcação e consultar relatórios de atendimento. |
| **Equipe de Desenvolvimento** | Alunos responsáveis pelo planejamento, modelagem, código e testes. | Garantir que os requisitos levantados sejam implementados com qualidade, documentados e validados conforme os critérios da disciplina. |

---

## 3. Requisitos Funcionais (RF)

Os requisitos funcionais descrevem as ações e serviços que o sistema **HoraCerta** deve executar para atender aos stakeholders.

| ID | Nome | Descrição Detalhada | Prioridade | Status |
| :--- | :--- | :--- | :---: | :---: |
| **RF01** | **Gestão de Serviços** | O sistema deve permitir ao profissional cadastrar, editar e exibir os serviços oferecidos, informando nome, descrição, duração estimada (em minutos) e preço. | Alta | Implementado |
| **RF02** | **Agendamento Online** | O sistema deve fornecer uma interface pública onde o cliente seleciona o serviço desejado, o profissional, a data e um horário disponível, informando seus dados de contato (nome e telefone) para confirmar a reserva. | Alta | Implementado |
| **RF03** | **Painel Gerencial** | O sistema deve disponibilizar um dashboard administrativo para o prestador acompanhar a grade de horários ocupados, visualizar detalhes dos agendamentos, filtrar histórico e consultar métricas/relatórios. | Alta | Implementado |
| **RF04** | **Trava Anti-Conflito** | O sistema deve validar a disponibilidade em tempo real e bloquear automaticamente horários já reservados ou bloqueados manualmente, impedindo sobreposição de atendimentos no mesmo horário para o mesmo profissional. | Alta | Implementado |
| **RF05** | **Cancelamento de Reserva** | O sistema deve permitir o cancelamento de um agendamento existente tanto pelo cliente (na tela de confirmação/comprovante) quanto pelo profissional (no painel gerencial), liberando novamente o horário na grade. | Média | Implementado |

---

## 4. Requisitos Não Funcionais (RNF)

Os requisitos não funcionais definem os critérios de qualidade, restrições técnicas e padrões de experiência sob os quais o sistema opera.

| ID | Categoria | Descrição Detalhada | Status |
| :--- | :--- | :--- | :---: |
| **RNF01** | **Design e Usabilidade** | O sistema deve apresentar uma interface limpa, intuitiva e responsiva (abordagem *Mobile-First*), garantindo boa legibilidade e navegação fluida tanto em smartphones quanto em computadores desktop. | Implementado |
| **RNF02** | **Desempenho** | A comunicação entre o frontend e a API REST deve ocorrer de forma ágil, carregando catálogos de serviços, grades de horários disponíveis e listagens do painel sem atrasos perceptíveis ao usuário. | Implementado |

---

## 5. Matriz de Rastreabilidade

A tabela abaixo demonstra a relação direta entre os requisitos levantados, os modelos UML, os protótipos de tela e os casos de teste executados:

| Requisito | Caso de Uso (UML) | Protótipo de Tela | Caso de Teste |
| :--- | :--- | :--- | :--- |
| **RF01** | Cadastrar serviços / Editar serviços / Listar serviços | Tela 1 (Catálogo) e Tela 3 (Dashboard) | CT01, CT03, CT04 |
| **RF02** | Selecionar profissional / Consultar horários / Realizar agendamento | Tela 1, Tela 2 e Tela 4 (Comprovante) | CT01, CT04 |
| **RF03** | Visualizar agenda / Consultar status / Bloquear horários | Tela 3 (Dashboard e Agenda) | CT02, CT03, CT04 |
| **RF04** | Consultar horários disponíveis / Realizar agendamento | Tela 2 (Escolha de data e horário) | CT04, CT05 |
| **RF05** | Cancelar agendamento | Tela 3 (Dashboard) e Tela 4 (Comprovante) | CT02 |
| **RNF01** | Todos os fluxos de interação | Design System e Telas 1 a 4 | CT01, CT02, CT03 |
| **RNF02** | Todas as consultas à API | Integração Geral | CT04, CT05 |