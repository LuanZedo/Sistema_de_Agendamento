# Documentação de Prototipação e Design System — HoraCerta

Este documento apresenta as diretrizes visuais, o **Design System** e a descrição funcional dos protótipos de alta fidelidade concebidos antes da etapa de desenvolvimento do sistema **HoraCerta**, atendendo aos requisitos funcionais (`RF01` a `RF05`) e não funcionais (`RNF01 - Design e Usabilidade Mobile-First`).

---

## 1. Design System e Identidade Visual

Para garantir consistência visual, acessibilidade e uma experiência moderna tanto em dispositivos móveis quanto em desktops, foi estabelecido um guia de estilo unificado:

### 1.1 Paleta de Cores

| Token / Papel | Código Hexadecimal | Aplicação na Interface |
| :--- | :--- | :--- |
| **Primária** | `#6C3EF5` | Botões principais (*CTAs*), destaques de seleção, barra de progresso e menu ativo. |
| **Secundária** | `#7C5CFA` | Elementos de apoio, ícones ativos e variações de destaque. |
| **Fundo (*Background*)** | `#F8F9FC` | Fundo geral das páginas, proporcionando contraste suave com os cartões brancos. |
| **Texto Principal** | `#1F2633` | Títulos, rótulos e informações principais com alta legibilidade. |
| **Sucesso** | `#22C55E` | Badges de status *Confirmado*, ícones de conclusão e ações ligadas ao WhatsApp. |
| **Alerta** | `#F59E0B` | Badges de status *Pendente* e avaliações de profissionais. |
| **Erro / Cancelamento** | `#EF4444` | Badges de status *Cancelado* e alertas de validação. |

### 1.2 Tipografia e Escala (Mobile-First)

* **Família Tipográfica:** `Inter` (com fallback para `Poppins` / `sans-serif`), escolhida pela alta legibilidade em telas pequenas e interfaces web.
* **Hierarquia de Tamanhos:**
  * **H1 (Título Principal):** `24px` / *Bold*
  * **H2 (Subtítulos de Seção):** `20px` / *SemiBold*
  * **H3 (Títulos de Cartões):** `18px` / *SemiBold*
  * **Corpo (Textos e Inputs):** `16px` / *Regular*
  * **Legenda (Metadados e Preços):** `14px` / *Regular*
  * **Auxiliar (Badges e Etiquetas):** `12px` / *Regular*

### 1.3 Componentes Principais

* **Botões:**
  * *Botão Primário:* Preenchimento sólido na cor `#6C3EF5`, texto branco e bordas arredondadas.
  * *Botão Secundário:* Fundo transparente ou claro com borda e texto em `#6C3EF5`.
* **Badges de Status:** Indicadores visuais em formato pílula para diferenciar rapidamente agendamentos *Confirmados* (verde), *Pendentes* (amarelo) e *Cancelados* (vermelho).
* **Cartões de Serviço (*Service Cards*):** Contêm ícone representativo, nome do serviço, valor formatado (`R$`), duração estimada em minutos e indicador de navegação.

---

## 2. Fluxo de Telas Prototipadas

Os protótipos cobrem as duas jornadas principais do sistema: a **Visão do Cliente** (fluxo em 3 etapas guiadas por barra de progresso) e a **Visão do Profissional/Dono** (painel administrativo).

### Tela 1 — Catálogo de Serviços e Seleção de Profissional (Visão Cliente)
* **Objetivo:** Permitir que o cliente conheça o estabelecimento, escolha o serviço desejado e selecione o profissional de sua preferência.
* **Elementos de Interface:**
  * Cabeçalho com logotipo **HoraCerta** e menu de navegação.
  * Banner de apresentação do estabelecimento com chamada para agendamento 24h.
  * Lista rolável *"Escolha um serviço"* exibindo nome, preço e tempo de duração (`RF01`, `RF02`).
  * Tela subsequente *"Escolha o profissional"* listando os prestadores disponíveis, foto, avaliação média e total de atendimentos realizados.
  * Indicador de progresso inferior (*Stepper*: `1. Serviço` $\rightarrow$ `2. Horário` $\rightarrow$ `3. Confirmação`).

### Tela 2 — Seleção de Data, Horários Disponíveis e Confirmação (Visão Cliente)
* **Objetivo:** Permitir a escolha do dia e horário livre na grade do profissional e coletar os dados do cliente para finalizar a reserva.
* **Elementos de Interface:**
  * Calendário mensal interativo para seleção da data.
  * Grade de botões *"Horários disponíveis"* exibindo apenas os horários livres (aplicação visual da trava anti-conflito `RF04`).
  * Tela de revisão *"Confirmar agendamento"* apresentando um resumo completo (serviço, profissional, data, horário e valor).
  * Formulário simplificado (*"Seus dados"*) solicitando **Nome completo** e **Telefone (WhatsApp)**, seguido pelo botão de confirmação.

### Tela 3 — Dashboard e Grade de Agenda (Visão Profissional / Dono)
* **Objetivo:** Fornecer ao prestador uma visão gerencial completa de seus compromissos, serviços e métricas (`RF03`).
* **Elementos de Interface:**
  * Menu lateral fixo com acesso rápido às seções: **Agenda**, **Serviços**, **Agendamentos**, **Bloquear horários**, **Relatórios** e **Configurações**.
  * Filtros de visualização da grade por **Dia**, **Semana** ou **Mês**, com navegação entre períodos.
  * Grade horária visual exibindo blocos coloridos com o nome do cliente e o serviço agendado em cada faixa de horário.

### Tela 4 — Sucesso e Comprovante de Agendamento (Visão Cliente)
* **Objetivo:** Confirmar visualmente a efetivação da reserva e oferecer ações rápidas pós-agendamento.
* **Elementos de Interface:**
  * Ícone de confirmação em destaque e resumo detalhado da reserva realizada.
  * Botões de ação rápida: *"Adicionar lembrete no WhatsApp"*, *"Adicionar ao calendário"* e opção *"Cancelar agendamento"* (`RF05`).

---

## 3. Arquivos de Referência na Pasta `/docs`

As artes completas do Design System e dos protótipos de tela encontram-se armazenadas neste diretório para consulta visual:
* `Mockup do Sistema.jpg`
* `Mockup do Sistema.pdf`