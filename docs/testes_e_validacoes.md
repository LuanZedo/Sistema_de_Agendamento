# Documentação de Testes e Validação — HoraCerta

Este documento registra os procedimentos, cenários e resultados obtidos durante a etapa de **Testes e Validação (Etapa 6)** do sistema **HoraCerta**, garantindo a conformidade das funcionalidades implementadas e a integridade da integração entre frontend, backend e banco de dados.

## 1. Ambiente e Resumo da Execução

* **Data de Execução:** 13/11/2026
* **Versão / Commit de Referência:** `d3b5db7`
* **Ambiente de Testes:** Microsoft Edge 157, Node.js `v24.21.0`, API REST local (`http://localhost:3333`)
* **Resoluções (*Viewports*) Testadas:**
  * Móvel (*Mobile-First*): $270 \times 900\text{ px}$
  * Computador (*Desktop*): $1280 \times 768\text{ px}$

### Resumo Geral

| Total de Casos Executados | Aprovados | Reprovados | Taxa de Sucesso |
| :---: | :---: | :---: | :---: |
| **5** | **5** | **0** | **100%** |

---

## 2. Casos de Teste Documentados

### CT01 — Seleção e rolagem dos serviços (Visão do Cliente)
* **Funcionalidade Testada:** Lista *"Escolha um serviço"* em tela móvel (`RF01`, `RF02`, `RNF01`).
* **Procedimento Realizado:** Abrir a visão do cliente com quatro serviços cadastrados; contar os cartões inicialmente visíveis na área delimitada e acionar a rolagem da lista.
* **Resultado Esperado:** Exibir três serviços por vez na área inicial e permitir alcançar os demais itens pela barra de rolagem sem quebrar o layout.
* **Resultado Obtido:** Quatro serviços carregados corretamente; três visíveis inicialmente e o quarto acessível após rolar.
* **Situação:** **APROVADO**

---

### CT02 — Histórico de agendamentos e filtros de Relatórios
* **Funcionalidade Testada:** Rolagem vertical do histórico e filtragem por status no painel gerencial (`RF03`, `RF05`).
* **Procedimento Realizado:** Abrir o histórico contendo 20 registros; conferir o limite inicial de exibição, rolar até o $11^\circ$ registro e aplicar o filtro de agendamentos cancelados.
* **Resultado Esperado:** Mostrar dez registros por vez; permitir rolagem fluida; atualizar a filtragem e a contagem exibida sem alterar os totalizadores gerais.
* **Resultado Obtido:** Dez registros apresentados no limite inicial; o $11^\circ$ apareceu ao rolar. O filtro exibiu `5 de 20` cancelados e a opção *"Todos"* restaurou os 20 registros íntegros.
* **Situação:** **APROVADO**

---

### CT03 — Rolagem de Serviços e Bloqueio de horários no painel
* **Funcionalidade Testada:** Comportamento das listagens do painel administrativo com até dez itens e com mais de dez itens (`RF01`, `RF03`, `RNF01`).
* **Procedimento Realizado:** Verificar as listas reais existentes (4 serviços e 2 bloqueios); em seguida, simular via DOM no navegador a adição de cartões temporários até totalizar 12 itens em cada lista para testar o comportamento de rolagem.
* **Resultado Esperado:** Não aplicar limitação desnecessária em listas curtas; ao atingir 12 itens, mostrar os dez primeiros inicialmente e permitir acessar os demais via rolagem.
* **Resultado Obtido:** Listas reais exibidas sem restrições desnecessárias. Nas duas listas simuladas com 12 itens, os dez primeiros couberam perfeitamente na área visível, os demais apareceram ao rolar e os elementos temporários foram descartados sem gravar dados no banco.
* **Situação:** **APROVADO**

---

### CT04 — Integração com a API e consulta de disponibilidade
* **Funcionalidade Testada:** Comunicação REST e estrutura JSON dos endpoints de configuração, serviços, profissionais, relatórios, bloqueios e disponibilidade (`RF02`, `RF04`, `RNF02`).
* **Procedimento Realizado:** Consultar por meio de requisições HTTP `GET` não destrutivas os endpoints da API local, sem criar, editar ou excluir registros existentes.
* **Resultado Esperado:** Respostas com status `HTTP 200 OK`, estruturas JSON válidas e dados consistentes para alimentar as telas do frontend.
* **Resultado Obtido:** Todos os endpoints consultados retornaram `HTTP 200`. Foram retornados 4 serviços, 3 profissionais, 2 bloqueios, configurações e relatórios; o endpoint de disponibilidade retornou 31 horários livres e a grade completa apresentou 32 entradas.
* **Situação:** **APROVADO**

---

### CT05 — Compilação do backend e validação do esquema de banco
* **Funcionalidade Testada:** Compilação do código TypeScript e integridade relacional do schema Prisma (`RNF02`).
* **Procedimento Realizado:** Executar os comandos `npm run build` e `npx --no-install prisma validate` diretamente no diretório `/backend`.
* **Resultado Esperado:** Compilação concluída sem erros de tipagem ou sintaxe e esquema do Prisma validado com sucesso.
* **Resultado Obtido:** Build concluído com código de saída `0`; o Prisma CLI confirmou que o arquivo `schema.prisma` é válido.
* **Situação:** **APROVADO**

---

## 3. Observações Técnicas sobre a Suíte Automatizada

Durante a validação final, o comando `npm test` (suíte automatizada presente em `backend/src/__tests__/api.test.ts`) não foi executado sobre o banco de desenvolvimento porque seu *hook* inicial limpa os registros existentes para rodar em ambiente isolado. Para preservar a integridade dos dados populados para demonstração, a validação foi conduzida por meio de testes funcionais no navegador, consultas `GET` não destrutivas na API, compilação de produção (`build`) e validação estática do esquema do banco de dados. Nenhuma falha foi identificada.