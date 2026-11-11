import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';

const filtrosSchema = z.object({
  dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(['PENDENTE', 'CONFIRMADO', 'CANCELADO']).optional(),
});

export class RelatorioController {
  static async listar(req: Request, res: Response): Promise<void> {
    try {
      const resultado = filtrosSchema.safeParse(req.query);
      if (!resultado.success) {
        res.status(400).json({ erro: 'Filtros inválidos para o relatório.', campos: resultado.error.errors });
        return;
      }

      const { dataInicio, dataFim, status } = resultado.data;
      if (dataInicio && dataFim && dataInicio > dataFim) {
        res.status(400).json({ erro: 'A data inicial deve ser anterior ou igual à data final.' });
        return;
      }

      const agendamentos = await prisma.agendamento.findMany({
        where: {
          ...(dataInicio || dataFim
            ? { data: { ...(dataInicio ? { gte: dataInicio } : {}), ...(dataFim ? { lte: dataFim } : {}) } }
            : {}),
          ...(status ? { status } : {}),
        },
        include: {
          cliente: { select: { nome: true } },
          profissional: { select: { nome: true } },
          servico: { select: { nome: true, preco: true } },
        },
        orderBy: [{ data: 'desc' }, { horario: 'asc' }],
      });

      const resumo = {
        total: agendamentos.length,
        confirmados: agendamentos.filter((agendamento) => agendamento.status === 'CONFIRMADO').length,
        pendentes: agendamentos.filter((agendamento) => agendamento.status === 'PENDENTE').length,
        cancelados: agendamentos.filter((agendamento) => agendamento.status === 'CANCELADO').length,
        faturamentoPrevisto: agendamentos
          .filter((agendamento) => agendamento.status !== 'CANCELADO')
          .reduce((total, agendamento) => total + agendamento.servico.preco, 0),
      };

      res.json({
        periodo: { dataInicio: dataInicio ?? null, dataFim: dataFim ?? null },
        resumo,
        agendamentos: agendamentos.map((agendamento) => ({
          id: agendamento.id,
          data: agendamento.data,
          horario: agendamento.horario,
          status: agendamento.status,
          cliente: agendamento.cliente.nome,
          profissional: agendamento.profissional.nome,
          servico: agendamento.servico.nome,
          valor: agendamento.servico.preco,
        })),
      });
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao gerar relatório.', detalhes: String(error) });
    }
  }
}
