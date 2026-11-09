import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { DisponibilidadeService, IntervaloOcupado } from '../services/DisponibilidadeService';

const criarAgendamentoSchema = z.object({
  profissionalId: z.number().int().positive('Selecione um profissional válido.'),
  servicoId: z.number().int().positive('Selecione um serviço válido.'),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'A data deve estar no formato YYYY-MM-DD.'),
  horario: z.string().regex(/^\d{2}:\d{2}$/, 'O horário deve estar no formato HH:mm.'),
  status: z.enum(['PENDENTE', 'CONFIRMADO']).optional().default('CONFIRMADO'),
  observacoes: z.string().optional(),
  // Permite informar clienteId existente OU os dados do formulário público (Tela 2: Nome completo + WhatsApp)
  clienteId: z.number().int().positive().optional(),
  clienteNome: z.string().min(2).optional(),
  clienteTelefone: z.string().min(8).optional(),
  clienteEmail: z.string().email().optional().nullable(),
  cliente: z
    .object({
      nome: z.string().min(2, 'Informe o nome completo do cliente.'),
      telefone: z.string().min(8, 'Informe o telefone (WhatsApp) do cliente.'),
      email: z.string().email().optional().nullable(),
    })
    .optional(),
});

const cancelarAgendamentoSchema = z.object({
  canceladoPor: z.enum(['CLIENTE', 'PROFISSIONAL']).optional().default('CLIENTE'),
  motivoCancelamento: z.string().optional(),
});

/**
 * Controller de Agendamentos - Implementa RF02, RF03, RF04, RF05 e métodos do Diagrama UML:
 * +realizarAgendamento(), +confirmar(), +cancelar(), +consultarStatus()
 */
export class AgendamentoController {
  // GET /agendamentos - RF03: Listagem geral/filtrada de agendamentos e seus status
  static async listar(req: Request, res: Response): Promise<void> {
    try {
      const { profissionalId, clienteId, data, dataInicio, dataFim, status } = req.query;

      const where: Record<string, unknown> = {};
      if (profissionalId) where.profissionalId = Number(profissionalId);
      if (clienteId) where.clienteId = Number(clienteId);
      if (status) where.status = String(status).toUpperCase();

      if (data) {
        where.data = String(data);
      } else if (dataInicio || dataFim) {
        where.data = {
          ...(dataInicio ? { gte: String(dataInicio) } : {}),
          ...(dataFim ? { lte: String(dataFim) } : {}),
        };
      }

      const agendamentos = await prisma.agendamento.findMany({
        where,
        include: {
          cliente: true,
          profissional: {
            select: { id: true, nome: true, telefone: true, avaliacao: true },
          },
          servico: true,
        },
        orderBy: [{ data: 'asc' }, { horario: 'asc' }],
      });

      res.json(agendamentos);
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao listar agendamentos.', detalhes: String(error) });
    }
  }

  // GET /agendamentos/:id - Diagrama UML: +consultarStatus()
  static async consultarStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const agendamento = await prisma.agendamento.findUnique({
        where: { id },
        include: {
          cliente: true,
          profissional: true,
          servico: true,
        },
      });

      if (!agendamento) {
        res.status(404).json({ erro: 'Agendamento não encontrado.' });
        return;
      }

      res.json(agendamento);
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao consultar agendamento.', detalhes: String(error) });
    }
  }

  /**
   * POST /agendamentos
   * RF02: Selecionar profissional, serviço, data e horário disponível para confirmar o agendamento.
   * RF04: Bloquear automaticamente horários já ocupados para evitar choque de agenda.
   */
  static async realizarAgendamento(req: Request, res: Response): Promise<void> {
    try {
      const dados = criarAgendamentoSchema.parse(req.body);

      const nomeCliente = dados.cliente?.nome ?? dados.clienteNome;
      const telefoneCliente = dados.cliente?.telefone ?? dados.clienteTelefone;
      const emailCliente = dados.cliente?.email ?? dados.clienteEmail ?? null;

      if (!dados.clienteId && (!nomeCliente || !telefoneCliente)) {
        res.status(400).json({
          erro: 'Informe "clienteId" ou os dados do cliente ("clienteNome" e "clienteTelefone" / objeto "cliente").',
        });
        return;
      }

      const resultado = await prisma.$transaction(async (tx) => {
        // 1. Verifica profissional e serviço
        const [profissional, servico] = await Promise.all([
          tx.profissional.findUnique({ where: { id: dados.profissionalId } }),
          tx.servico.findUnique({ where: { id: dados.servicoId } }),
        ]);

        if (!profissional || !profissional.ativo) {
          throw { statusCode: 404, mensagem: 'Profissional não encontrado ou inativo.' };
        }

        if (!servico || !servico.ativo) {
          throw { statusCode: 404, mensagem: 'Serviço não encontrado ou inativo.' };
        }

        // 2. Calcula horário de término com base na duração do serviço
        const horarioFim = DisponibilidadeService.calcularHorarioFim(dados.horario, servico.duracao);

        // 3. Verifica se está dentro do expediente do profissional
        const inicioMin = DisponibilidadeService.paraMinutos(dados.horario);
        const fimMin = DisponibilidadeService.paraMinutos(horarioFim);
        const expInicioMin = DisponibilidadeService.paraMinutos(profissional.horarioInicioExpediente);
        const expFimMin = DisponibilidadeService.paraMinutos(profissional.horarioFimExpediente);

        if (inicioMin < expInicioMin || fimMin > expFimMin) {
          throw {
            statusCode: 400,
            mensagem: `Horário fora do expediente do profissional (${profissional.horarioInicioExpediente} às ${profissional.horarioFimExpediente}).`,
          };
        }

        // 4. RF04: Verifica choque de horário com agendamentos ativos e bloqueios manuais
        const [agendamentosDoDia, bloqueiosDoDia] = await Promise.all([
          tx.agendamento.findMany({
            where: {
              profissionalId: dados.profissionalId,
              data: dados.data,
              status: { in: ['PENDENTE', 'CONFIRMADO'] },
            },
          }),
          tx.bloqueioAgenda.findMany({
            where: {
              profissionalId: dados.profissionalId,
              data: dados.data,
            },
          }),
        ]);

        const intervalosOcupados: IntervaloOcupado[] = [
          ...agendamentosDoDia.map((ag) => ({
            horarioInicio: ag.horario,
            horarioFim: ag.horarioFim,
            origem: 'AGENDAMENTO' as const,
            referenciaId: ag.id,
          })),
          ...bloqueiosDoDia.map((bl) => ({
            horarioInicio: bl.horarioInicio,
            horarioFim: bl.horarioFim,
            origem: 'BLOQUEIO' as const,
            referenciaId: bl.id,
          })),
        ];

        const conflito = DisponibilidadeService.verificarChoqueNaAgenda(
          dados.horario,
          horarioFim,
          intervalosOcupados
        );

        if (conflito) {
          throw {
            statusCode: 409,
            mensagem: `RF04 - Choque de horário detectado! O intervalo ${dados.horario} - ${horarioFim} conflita com um horário já ocupado (${conflito.horarioInicio} - ${conflito.horarioFim}).`,
            conflito,
          };
        }

        // 5. Resolve ou cadastra o Cliente pelo Telefone (WhatsApp)
        let clienteIdFinal = dados.clienteId;
        if (!clienteIdFinal && nomeCliente && telefoneCliente) {
          const clienteExistente = await tx.cliente.findUnique({
            where: { telefone: telefoneCliente },
          });

          if (clienteExistente) {
            const atualizado = await tx.cliente.update({
              where: { id: clienteExistente.id },
              data: {
                nome: nomeCliente,
                ...(emailCliente ? { email: emailCliente } : {}),
              },
            });
            clienteIdFinal = atualizado.id;
          } else {
            const novoCliente = await tx.cliente.create({
              data: {
                nome: nomeCliente,
                telefone: telefoneCliente,
                email: emailCliente,
              },
            });
            clienteIdFinal = novoCliente.id;
          }
        }

        // 6. Cria o Agendamento
        const novoAgendamento = await tx.agendamento.create({
          data: {
            data: dados.data,
            horario: dados.horario,
            horarioFim,
            status: dados.status,
            observacoes: dados.observacoes,
            clienteId: clienteIdFinal!,
            profissionalId: dados.profissionalId,
            servicoId: dados.servicoId,
          },
          include: {
            cliente: true,
            profissional: true,
            servico: true,
          },
        });

        return novoAgendamento;
      });

      res.status(201).json({
        mensagem: 'Agendamento confirmado! Seu horário foi reservado com sucesso.',
        agendamento: resultado,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ erro: 'Dados inválidos para agendamento.', campos: error.errors });
        return;
      }
      if (error && typeof error.statusCode === 'number') {
        res.status(error.statusCode).json({
          erro: error.mensagem,
          ...(error.conflito ? { conflito: error.conflito } : {}),
        });
        return;
      }
      res.status(500).json({ erro: 'Erro interno ao realizar agendamento.', detalhes: String(error) });
    }
  }

  /**
   * PATCH /agendamentos/:id/confirmar
   * Escopo MVP 3 e Diagrama UML (+confirmar()): Confirmação do agendamento no painel do prestador.
   */
  static async confirmar(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const agendamento = await prisma.agendamento.findUnique({ where: { id } });

      if (!agendamento) {
        res.status(404).json({ erro: 'Agendamento não encontrado.' });
        return;
      }

      if (agendamento.status === 'CANCELADO') {
        res.status(400).json({ erro: 'Não é possível confirmar um agendamento já cancelado.' });
        return;
      }

      const atualizado = await prisma.agendamento.update({
        where: { id },
        data: { status: 'CONFIRMADO' },
        include: { cliente: true, profissional: true, servico: true },
      });

      res.json({
        mensagem: 'Agendamento confirmado com sucesso.',
        agendamento: atualizado,
      });
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao confirmar agendamento.', detalhes: String(error) });
    }
  }

  /**
   * PATCH /agendamentos/:id/cancelar
   * RF05: O sistema deve permitir o cancelamento do agendamento tanto pelo cliente quanto pelo profissional.
   */
  static async cancelar(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const dados = cancelarAgendamentoSchema.parse(req.body ?? {});

      const agendamento = await prisma.agendamento.findUnique({ where: { id } });
      if (!agendamento) {
        res.status(404).json({ erro: 'Agendamento não encontrado.' });
        return;
      }

      if (agendamento.status === 'CANCELADO') {
        res.status(400).json({ erro: 'Este agendamento já se encontra cancelado.' });
        return;
      }

      const cancelado = await prisma.agendamento.update({
        where: { id },
        data: {
          status: 'CANCELADO',
          canceladoPor: dados.canceladoPor,
          motivoCancelamento:
            dados.motivoCancelamento ?? `Cancelado pelo ${dados.canceladoPor.toLowerCase()}`,
        },
        include: { cliente: true, profissional: true, servico: true },
      });

      res.json({
        mensagem: `Agendamento cancelado com sucesso pelo ${dados.canceladoPor.toLowerCase()}. O horário ${cancelado.horario} está novamente disponível!`,
        agendamento: cancelado,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ erro: 'Dados inválidos para cancelamento.', campos: error.errors });
        return;
      }
      res.status(500).json({ erro: 'Erro ao cancelar agendamento.', detalhes: String(error) });
    }
  }
}
