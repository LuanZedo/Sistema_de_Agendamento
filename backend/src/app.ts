import express from 'express';
import cors from 'cors';
import { routes } from './routes';

export const app = express();

app.use(cors());
app.use(express.json());

// Rota inicial com documentação rápida dos endpoints da API HoraCerta
app.get('/', (_req, res) => {
  res.json({
    sistema: 'HoraCerta API - Sistema de Agendamento para Pequeno Comércio',
    status: 'ONLINE',
    requisitosAtendidos: [
      'RF01: Cadastro, edição e listagem de serviços (nome, preço e duração)',
      'RF02: Seleção de profissional, serviço, data e horário disponível para agendamento',
      'RF03: Painel gerencial com grade de horários ocupados e status de cada atendimento',
      'RF04: Bloqueio automático de horários ocupados para evitar choque de agenda',
      'RF05: Cancelamento de agendamento pelo cliente e pelo profissional',
    ],
    endpoints: {
      servicos: {
        listar: 'GET /api/servicos',
        buscar: 'GET /api/servicos/:id',
        cadastrar: 'POST /api/servicos',
        editar: 'PUT /api/servicos/:id',
      },
      profissionais: {
        listar: 'GET /api/profissionais',
        cadastrar: 'POST /api/profissionais',
        disponibilidade: 'GET /api/profissionais/:id/disponibilidade?data=YYYY-MM-DD&servicoId=1',
        agendaPainel: 'GET /api/profissionais/:id/agenda?dataInicio=YYYY-MM-DD&dataFim=YYYY-MM-DD',
      },
      agendamentos: {
        listar: 'GET /api/agendamentos',
        consultarStatus: 'GET /api/agendamentos/:id',
        realizar: 'POST /api/agendamentos',
        editarDataHorario: 'PATCH /api/agendamentos/:id',
        remover: 'DELETE /api/agendamentos/:id',
        confirmar: 'PATCH /api/agendamentos/:id/confirmar',
        cancelar: 'PATCH /api/agendamentos/:id/cancelar',
      },
      bloqueios: {
        listar: 'GET /api/bloqueios',
        criar: 'POST /api/bloqueios',
        remover: 'DELETE /api/bloqueios/:id',
      },
      clientes: {
        listar: 'GET /api/clientes',
      },
      relatorios: {
        listar: 'GET /api/relatorios?dataInicio=YYYY-MM-DD&dataFim=YYYY-MM-DD&status=CONFIRMADO',
      },
      configuracoes: {
        buscar: 'GET /api/configuracoes',
        atualizar: 'PUT /api/configuracoes',
      },
    },
  });
});

// Prefixo /api e também na raiz para facilitar integração com qualquer frontend
app.use('/api', routes);
app.use('/', routes);
