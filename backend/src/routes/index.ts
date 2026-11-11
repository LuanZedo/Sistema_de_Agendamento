import { Router } from 'express';
import { ServicoController } from '../controllers/ServicoController';
import { ProfissionalController } from '../controllers/ProfissionalController';
import { AgendamentoController } from '../controllers/AgendamentoController';
import { BloqueioController } from '../controllers/BloqueioController';
import { ClienteController } from '../controllers/ClienteController';
import { RelatorioController } from '../controllers/RelatorioController';
import { ConfiguracaoController } from '../controllers/ConfiguracaoController';

export const routes = Router();

// ============================================================================
// 1. Rotas de Serviços (RF01 - Cadastro, edição e listagem de serviços)
// ============================================================================
routes.get('/servicos', ServicoController.listar);
routes.get('/servicos/:id', ServicoController.buscarPorId);
routes.post('/servicos', ServicoController.cadastrar);
routes.put('/servicos/:id', ServicoController.editar);

// ============================================================================
// 2. Rotas de Profissionais, Disponibilidade e Painel de Agenda (RF02, RF03, RF04)
// ============================================================================
routes.get('/profissionais', ProfissionalController.listar);
routes.post('/profissionais', ProfissionalController.cadastrar);
routes.get('/profissionais/:id/disponibilidade', ProfissionalController.consultarDisponibilidade);
routes.get('/profissionais/:id/agenda', ProfissionalController.visualizarAgenda);

// ============================================================================
// 3. Rotas de Agendamentos (RF02, RF03, RF04, RF05)
// ============================================================================
routes.get('/agendamentos', AgendamentoController.listar);
routes.get('/agendamentos/:id', AgendamentoController.consultarStatus);
routes.post('/agendamentos', AgendamentoController.realizarAgendamento);
routes.patch('/agendamentos/:id/confirmar', AgendamentoController.confirmar);
routes.patch('/agendamentos/:id/cancelar', AgendamentoController.cancelar);

// ============================================================================
// 4. Rotas de Bloqueio de Horários (Caso de Uso: Bloquear horários ocupados)
// ============================================================================
routes.get('/bloqueios', BloqueioController.listar);
routes.post('/bloqueios', BloqueioController.criar);
routes.delete('/bloqueios/:id', BloqueioController.remover);

// ============================================================================
// 5. Rotas de Clientes
// ============================================================================
routes.get('/clientes', ClienteController.listar);

// ============================================================================
// 6. Relatórios e configurações do estabelecimento
// ============================================================================
routes.get('/relatorios', RelatorioController.listar);
routes.get('/configuracoes', ConfiguracaoController.buscar);
routes.put('/configuracoes', ConfiguracaoController.atualizar);
