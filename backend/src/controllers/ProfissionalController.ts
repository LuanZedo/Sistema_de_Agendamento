import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { DisponibilidadeService, IntervaloOcupado } from '../services/DisponibilidadeService';
import { horarioFuncionamentoNaData, obterConfiguracao } from '../services/ConfiguracaoService';

const profissionalSchema = z.object({
  nome: z.string().min(2, 'O nome do profissional é obrigatório.'),
  telefone: z.string().min(8, 'O telefone do profissional é obrigatório.'),
  email: z.string().email('E-mail inválido.'),
  avaliacao: z.number().min(0).max(5).optional().default(5.0),
  totalAtendimentos: z.number().int().nonnegative().optional().default(0),
  horarioInicioExpediente: z.string().regex(/^\d{2}:\d{2}$/).optional().default('08:00'),
  horarioFimExpediente: z.string().regex(/^\d{2}:\d{2}$/).optional().default('18:00'),
});

/**
 * Controller de Profissionais - Implementa RF02, RF03, RF04 e métodos da classe Profissional:
 * +visualizarAgenda(), consulta de horários disponíveis e listagem para seleção do cliente.
 */
export class ProfissionalController {
  // GET /profissionais - Lista profissionais ativos (Tela 2 - "Escolha o profissional")
  static async listar(_req: Request, res: Response): Promise<void> {
    try {
      const profissionais = await prisma.profissional.findMany({
        where: { ativo: true },
        orderBy: { avaliacao: 'desc' },
      });

      res.json(profissionais);
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao listar profissionais.', detalhes: String(error) });
    }
  }

  // POST /profissionais - Cadastra novo profissional
  static async cadastrar(req: Request, res: Response): Promise<void> {
    try {
      const dados = profissionalSchema.parse(req.body);
      const profissional = await prisma.profissional.create({ data: dados });
      res.status(201).json(profissional);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ erro: 'Dados inválidos.', campos: error.errors });
        return;
      }
      res.status(500).json({ erro: 'Erro ao cadastrar profissional.', detalhes: String(error) });
    }
  }

  /**
   * GET /profissionais/:id/disponibilidade?data=YYYY-MM-DD&servicoId=1
   * RF02 e RF04: Retorna todos os horários do dia para o profissional, bloqueando
   * automaticamente horários já ocupados ou que não comportem a duração do serviço escolhido.
   */
  static async consultarDisponibilidade(req: Request, res: Response): Promise<void> {
    try {
      const profissionalId = Number(req.params.id);
      const data = String(req.query.data || '');
      const servicoId = req.query.servicoId ? Number(req.query.servicoId) : null;

      if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
        res.status(400).json({
          erro: 'Parâmetro "data" obrigatório no formato YYYY-MM-DD (ex: 2025-11-12).',
        });
        return;
      }

      const profissional = await prisma.profissional.findUnique({
        where: { id: profissionalId },
      });

      if (!profissional) {
        res.status(404).json({ erro: 'Profissional não encontrado.' });
        return;
      }

      const configuracao = await obterConfiguracao();
      const expedienteDia = horarioFuncionamentoNaData(configuracao, data);
      let duracaoServicoMinutos = 30;
      let servicoSelecionado = null;

      if (servicoId) {
        servicoSelecionado = await prisma.servico.findUnique({ where: { id: servicoId } });
        if (!servicoSelecionado) {
          res.status(404).json({ erro: 'Serviço informado não encontrado.' });
          return;
        }
        duracaoServicoMinutos = servicoSelecionado.duracao;
      }

      // Busca agendamentos ativos (PENDENTE ou CONFIRMADO) na data (RF04)
      const [agendamentosAtivos, bloqueiosManuais] = await Promise.all([
        prisma.agendamento.findMany({
          where: {
            profissionalId,
            data,
            status: { in: ['PENDENTE', 'CONFIRMADO'] },
          },
          select: { id: true, horario: true, horarioFim: true },
        }),
        prisma.bloqueioAgenda.findMany({
          where: { profissionalId, data },
          select: { id: true, horarioInicio: true, horarioFim: true },
        }),
      ]);

      const intervalosOcupados: IntervaloOcupado[] = [
        ...agendamentosAtivos.map((ag) => ({
          horarioInicio: ag.horario,
          horarioFim: ag.horarioFim,
          origem: 'AGENDAMENTO' as const,
          referenciaId: ag.id,
        })),
        ...bloqueiosManuais.map((bl) => ({
          horarioInicio: bl.horarioInicio,
          horarioFim: bl.horarioFim,
          origem: 'BLOQUEIO' as const,
          referenciaId: bl.id,
        })),
      ];
      const inicioIntervalo = DisponibilidadeService.paraMinutos(expedienteDia.lunchStart);
      const fimIntervalo = DisponibilidadeService.paraMinutos(expedienteDia.lunchEnd);
      if (expedienteDia.open && fimIntervalo > inicioIntervalo) {
        intervalosOcupados.push({
          horarioInicio: expedienteDia.lunchStart,
          horarioFim: expedienteDia.lunchEnd,
          origem: 'INTERVALO',
        });
      }

      const grade = expedienteDia.open
        ? DisponibilidadeService.gerarGradeHorarios({
            inicioExpediente: expedienteDia.start,
            fimExpediente: expedienteDia.end,
            duracaoServicoMinutos,
            passoMinutos: configuracao.intervaloMinutos,
            ocupados: intervalosOcupados,
          }).map((slot) => {
            const antecedenciaOk = configuracao.antecedenciaMinutos === 0
              || new Date(`${data}T${slot.horario}:00`).getTime()
                >= Date.now() + configuracao.antecedenciaMinutos * 60_000;
            return antecedenciaOk
              ? slot
              : { ...slot, disponivel: false, motivoIndisponibilidade: 'Antecedência mínima não atendida' };
          })
        : [];

      res.json({
        profissional: {
          id: profissional.id,
          nome: profissional.nome,
          expediente: expedienteDia.open ? `${expedienteDia.start} - ${expedienteDia.end}` : 'Fechado',
        },
        data,
        servico: servicoSelecionado
          ? {
              id: servicoSelecionado.id,
              nome: servicoSelecionado.nome,
              duracao: servicoSelecionado.duracao,
              preco: servicoSelecionado.preco,
            }
          : { duracaoPadrao: duracaoServicoMinutos },
        horariosDisponiveis: grade.filter((s) => s.disponivel).map((s) => s.horario),
        gradeCompleta: grade,
      });
    } catch (error) {
      res.status(500).json({
        erro: 'Erro ao consultar disponibilidade de horários.',
        detalhes: String(error),
      });
    }
  }

  /**
   * GET /profissionais/:id/agenda?dataInicio=YYYY-MM-DD&dataFim=YYYY-MM-DD
   * RF03: Painel gerencial para o profissional visualizar a grade de horários ocupados
   * e o status de cada atendimento (Tela 3 - Visão Dia / Semana / Mês).
   */
  static async visualizarAgenda(req: Request, res: Response): Promise<void> {
    try {
      const profissionalId = Number(req.params.id);
      const { data, dataInicio, dataFim, status } = req.query;

      const profissional = await prisma.profissional.findUnique({
        where: { id: profissionalId },
      });

      if (!profissional) {
        res.status(404).json({ erro: 'Profissional não encontrado.' });
        return;
      }

      const filtroData: Record<string, unknown> = {};
      if (data) {
        filtroData.equals = String(data);
      } else if (dataInicio && dataFim) {
        filtroData.gte = String(dataInicio);
        filtroData.lte = String(dataFim);
      } else if (dataInicio) {
        filtroData.gte = String(dataInicio);
      }

      const whereAgendamento: Record<string, unknown> = { profissionalId };
      if (Object.keys(filtroData).length > 0) {
        whereAgendamento.data = filtroData;
      }
      if (status) {
        whereAgendamento.status = String(status).toUpperCase();
      }

      const [agendamentos, bloqueios] = await Promise.all([
        prisma.agendamento.findMany({
          where: whereAgendamento,
          include: {
            cliente: true,
            servico: true,
          },
          orderBy: [{ data: 'asc' }, { horario: 'asc' }],
        }),
        prisma.bloqueioAgenda.findMany({
          where: {
            profissionalId,
            ...(Object.keys(filtroData).length > 0 ? { data: filtroData } : {}),
          },
          orderBy: [{ data: 'asc' }, { horarioInicio: 'asc' }],
        }),
      ]);

      const resumo = {
        total: agendamentos.length,
        confirmados: agendamentos.filter((a) => a.status === 'CONFIRMADO').length,
        pendentes: agendamentos.filter((a) => a.status === 'PENDENTE').length,
        cancelados: agendamentos.filter((a) => a.status === 'CANCELADO').length,
        faturamentoPrevisto: agendamentos
          .filter((a) => a.status !== 'CANCELADO')
          .reduce((acc, a) => acc + a.servico.preco, 0),
      };

      res.json({
        profissional: {
          id: profissional.id,
          nome: profissional.nome,
          avaliacao: profissional.avaliacao,
          totalAtendimentos: profissional.totalAtendimentos,
        },
        resumo,
        agendamentos,
        bloqueios,
      });
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao carregar agenda do profissional.', detalhes: String(error) });
    }
  }
}
