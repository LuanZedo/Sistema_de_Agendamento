import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../config/prisma';
import { ServicoController } from '../controllers/ServicoController';
import { ProfissionalController } from '../controllers/ProfissionalController';
import { AgendamentoController } from '../controllers/AgendamentoController';
import { BloqueioController } from '../controllers/BloqueioController';
import { RelatorioController } from '../controllers/RelatorioController';
import { ConfiguracaoController } from '../controllers/ConfiguracaoController';

/**
 * Helper leve para invocar controllers Express em memória durante os testes
 */
async function callController(
  handler: (req: any, res: any) => Promise<void>,
  options: {
    params?: Record<string, string>;
    query?: Record<string, string>;
    body?: Record<string, unknown>;
  } = {}
): Promise<{ status: number; body: any }> {
  let statusCode = 200;
  let responseBody: any = null;

  const req = {
    params: options.params ?? {},
    query: options.query ?? {},
    body: options.body ?? {},
  };

  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(payload: any) {
      responseBody = payload;
      return this;
    },
  };

  await handler(req, res);
  return { status: statusCode, body: responseBody };
}

describe('HoraCerta Backend - Testes Automatizados (RF01 a RF05)', () => {
  let profId: number;
  let servicoCorteId: number;
  let servicoComboId: number;
  let agendamentoCriadoId: number;

  before(async () => {
    await prisma.agendamento.deleteMany();
    await prisma.bloqueioAgenda.deleteMany();
    await prisma.configuracao.deleteMany();
    await prisma.servico.deleteMany();
    await prisma.cliente.deleteMany();
    await prisma.profissional.deleteMany();

    const resProf = await callController(ProfissionalController.cadastrar, {
      body: {
        nome: 'Lucas Almeida',
        telefone: '(11) 98888-0001',
        email: 'lucas@horacerta.com.br',
        avaliacao: 4.9,
        totalAtendimentos: 128,
      },
    });
    profId = resProf.body.id;
  });

  after(async () => {
    await prisma.configuracao.deleteMany();
    await prisma.$disconnect();
  });

  test('RF01 - Deve cadastrar, editar e listar serviços com nome, preço e duração', async () => {
    const resCorte = await callController(ServicoController.cadastrar, {
      body: {
        nome: 'Corte Masculino',
        descricao: 'Corte social ou degradê',
        preco: 40,
        duracao: 30,
      },
    });
    assert.equal(resCorte.status, 201);
    servicoCorteId = resCorte.body.id;

    const resCombo = await callController(ServicoController.cadastrar, {
      body: {
        nome: 'Corte + Barba',
        preco: 60,
        duracao: 50,
      },
    });
    assert.equal(resCombo.status, 201);
    servicoComboId = resCombo.body.id;

    // Edita o preço de Corte + Barba para R$ 65,00 (conforme Tela 1)
    const resEdit = await callController(ServicoController.editar, {
      params: { id: String(servicoComboId) },
      body: { preco: 65 },
    });
    assert.equal(resEdit.status, 200);
    assert.equal(resEdit.body.preco, 65);

    const resList = await callController(ServicoController.listar);
    assert.equal(resList.status, 200);
    assert.equal(resList.body.length, 2);
  });

  test('RF02 - Deve realizar agendamento selecionando profissional, serviço, data e horário', async () => {
    const resAg = await callController(AgendamentoController.realizarAgendamento, {
      body: {
        profissionalId: profId,
        servicoId: servicoCorteId,
        data: '2025-11-12',
        horario: '11:00',
        status: 'PENDENTE',
        cliente: {
          nome: 'João Silva',
          telefone: '(11) 99999-1234',
        },
      },
    });

    assert.equal(resAg.status, 201);
    assert.equal(resAg.body.agendamento.horario, '11:00');
    assert.equal(resAg.body.agendamento.horarioFim, '11:30');
    assert.equal(resAg.body.agendamento.cliente.nome, 'João Silva');
    agendamentoCriadoId = resAg.body.agendamento.id;
  });

  test('RF04 - Deve bloquear automaticamente horários ocupados e impedir choque de agenda', async () => {
    // 1. Tenta agendar no mesmo horário exato (11:00)
    const resConflitoExato = await callController(AgendamentoController.realizarAgendamento, {
      body: {
        profissionalId: profId,
        servicoId: servicoCorteId,
        data: '2025-11-12',
        horario: '11:00',
        cliente: {
          nome: 'Outro Cliente',
          telefone: '(11) 97777-0000',
        },
      },
    });
    assert.equal(resConflitoExato.status, 409);

    // 2. Tenta agendar um Corte + Barba (50 min) às 10:30 (terminaria 11:20, invadindo o das 11:00)
    const resConflitoParcial = await callController(AgendamentoController.realizarAgendamento, {
      body: {
        profissionalId: profId,
        servicoId: servicoComboId,
        data: '2025-11-12',
        horario: '10:30',
        cliente: {
          nome: 'Outro Cliente',
          telefone: '(11) 97777-0000',
        },
      },
    });
    assert.equal(resConflitoParcial.status, 409);

    // 3. Consulta disponibilidade para Corte (30 min) e verifica que 11:00 está bloqueado e 10:30 livre
    const resDisp = await callController(ProfissionalController.consultarDisponibilidade, {
      params: { id: String(profId) },
      query: { data: '2025-11-12', servicoId: String(servicoCorteId) },
    });
    assert.equal(resDisp.status, 200);
    assert.equal(resDisp.body.horariosDisponiveis.includes('11:00'), false);
    assert.equal(resDisp.body.horariosDisponiveis.includes('10:30'), true);
  });

  test('RF03 - Deve disponibilizar painel gerencial da agenda com status e permitir confirmação', async () => {
    const resConfirm = await callController(AgendamentoController.confirmar, {
      params: { id: String(agendamentoCriadoId) },
    });
    assert.equal(resConfirm.status, 200);
    assert.equal(resConfirm.body.agendamento.status, 'CONFIRMADO');

    const resAgenda = await callController(ProfissionalController.visualizarAgenda, {
      params: { id: String(profId) },
      query: { data: '2025-11-12' },
    });
    assert.equal(resAgenda.status, 200);
    assert.equal(resAgenda.body.resumo.confirmados, 1);
    assert.equal(resAgenda.body.resumo.faturamentoPrevisto, 40);
  });

  test('RF05 - Deve permitir o cancelamento do agendamento e liberar o horário novamente', async () => {
    const resCancel = await callController(AgendamentoController.cancelar, {
      params: { id: String(agendamentoCriadoId) },
      body: {
        canceladoPor: 'CLIENTE',
        motivoCancelamento: 'Imprevisto no trabalho',
      },
    });
    assert.equal(resCancel.status, 200);
    assert.equal(resCancel.body.agendamento.status, 'CANCELADO');
    assert.equal(resCancel.body.agendamento.canceladoPor, 'CLIENTE');

    // Horário das 11:00 deve voltar a ficar disponível após o cancelamento
    const resDisp = await callController(ProfissionalController.consultarDisponibilidade, {
      params: { id: String(profId) },
      query: { data: '2025-11-12', servicoId: String(servicoCorteId) },
    });
    assert.equal(resDisp.body.horariosDisponiveis.includes('11:00'), true);
  });

  test('Caso de Uso - Deve permitir ao profissional bloquear horários manualmente', async () => {
    const resBloq = await callController(BloqueioController.criar, {
      body: {
        profissionalId: profId,
        data: '2025-11-12',
        horarioInicio: '12:00',
        horarioFim: '13:00',
        motivo: 'Horário de almoço',
      },
    });
    assert.equal(resBloq.status, 201);

    const resDisp = await callController(ProfissionalController.consultarDisponibilidade, {
      params: { id: String(profId) },
      query: { data: '2025-11-12', servicoId: String(servicoCorteId) },
    });
    assert.equal(resDisp.body.horariosDisponiveis.includes('12:00'), false);
    assert.equal(resDisp.body.horariosDisponiveis.includes('12:30'), false);
    assert.equal(resDisp.body.horariosDisponiveis.includes('13:00'), true);
  });

  test('Caso de Uso - Deve bloquear o dia inteiro e remover todos os horários disponíveis', async () => {
    const data = '2099-12-31';
    const resBloq = await callController(BloqueioController.criar, {
      body: {
        profissionalId: profId,
        data,
        diaInteiro: true,
        motivo: 'Folga',
      },
    });

    assert.equal(resBloq.status, 201);
    assert.equal(resBloq.body.bloqueio.horarioInicio, '00:00');
    assert.equal(resBloq.body.bloqueio.horarioFim, '23:59');

    try {
      const resDisp = await callController(ProfissionalController.consultarDisponibilidade, {
        params: { id: String(profId) },
        query: { data, servicoId: String(servicoCorteId) },
      });
      assert.deepEqual(resDisp.body.horariosDisponiveis, []);
    } finally {
      await prisma.bloqueioAgenda.delete({ where: { id: resBloq.body.bloqueio.id } });
    }
  });

  test('Caso de Uso - Deve permitir consultar e editar um bloqueio existente', async () => {
    const resCriado = await callController(BloqueioController.criar, {
      body: {
        profissionalId: profId,
        data: '2099-12-30',
        horarioInicio: '12:00',
        horarioFim: '13:00',
        motivo: 'Almoço',
      },
    });
    const id = resCriado.body.bloqueio.id;

    try {
      const resConsulta = await callController(BloqueioController.buscarPorId, {
        params: { id: String(id) },
      });
      assert.equal(resConsulta.status, 200);
      assert.equal(resConsulta.body.motivo, 'Almoço');

      const resEdicao = await callController(BloqueioController.editar, {
        params: { id: String(id) },
        body: {
          profissionalId: profId,
          data: '2099-12-30',
          diaInteiro: true,
          motivo: 'Folga',
        },
      });
      assert.equal(resEdicao.status, 200);
      assert.equal(resEdicao.body.bloqueio.horarioInicio, '00:00');
      assert.equal(resEdicao.body.bloqueio.horarioFim, '23:59');
      assert.equal(resEdicao.body.bloqueio.motivo, 'Folga');
    } finally {
      await prisma.bloqueioAgenda.delete({ where: { id } });
    }
  });

  test('Dashboard - Deve gerar relatório e persistir as configurações do estabelecimento', async () => {
    const resRelatorio = await callController(RelatorioController.listar, {
      query: { dataInicio: '2025-11-12', dataFim: '2025-11-12' },
    });
    assert.equal(resRelatorio.status, 200);
    assert.equal(resRelatorio.body.resumo.total, 1);
    assert.equal(resRelatorio.body.resumo.cancelados, 1);
    assert.equal(resRelatorio.body.agendamentos[0].cliente, 'João Silva');

    const resFiltroInvalido = await callController(RelatorioController.listar, {
      query: { dataInicio: '2025-11-13', dataFim: '2025-11-12' },
    });
    assert.equal(resFiltroInvalido.status, 400);

    const resAtualizacao = await callController(ConfiguracaoController.atualizar, {
      body: { nome: 'Barbearia HoraCerta', telefone: '(11) 99999-0000', horario: '09:00-18:00' },
    });
    assert.equal(resAtualizacao.status, 200);

    const resConfiguracao = await callController(ConfiguracaoController.buscar);
    assert.equal(resConfiguracao.status, 200);
    assert.equal(resConfiguracao.body.nome, 'Barbearia HoraCerta');
    assert.equal(resConfiguracao.body.telefone, '(11) 99999-0000');
    assert.equal(resConfiguracao.body.horario, '09:00-18:00');
  });
});
