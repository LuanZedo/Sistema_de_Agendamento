import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { DisponibilidadeService } from '../services/DisponibilidadeService';

const bloqueioSchema = z.object({
  profissionalId: z.number().int().positive(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'A data deve estar no formato YYYY-MM-DD.'),
  diaInteiro: z.boolean().optional().default(false),
  horarioInicio: z.string().regex(/^\d{2}:\d{2}$/, 'Use o formato HH:mm.').optional(),
  horarioFim: z.string().regex(/^\d{2}:\d{2}$/, 'Use o formato HH:mm.').optional(),
  motivo: z.string().optional().default('Horário bloqueado pelo profissional'),
}).superRefine((dados, context) => {
  if (!dados.diaInteiro && !dados.horarioInicio) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['horarioInicio'], message: 'Informe o horário inicial.' });
  }
  if (!dados.diaInteiro && !dados.horarioFim) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['horarioFim'], message: 'Informe o horário final.' });
  }
});

/**
 * Controller para o Caso de Uso "Bloquear horários ocupados" (Diagrama de Casos de Uso e Tela 3)
 */
export class BloqueioController {
  // GET /bloqueios?profissionalId=1&data=2025-11-12
  static async listar(req: Request, res: Response): Promise<void> {
    try {
      const { profissionalId, data } = req.query;
      const where: Record<string, unknown> = {};
      if (profissionalId) where.profissionalId = Number(profissionalId);
      if (data) where.data = String(data);

      const bloqueios = await prisma.bloqueioAgenda.findMany({
        where,
        include: {
          profissional: { select: { id: true, nome: true } },
        },
        orderBy: [{ data: 'asc' }, { horarioInicio: 'asc' }],
      });

      res.json(bloqueios);
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao listar bloqueios.', detalhes: String(error) });
    }
  }

  // GET /bloqueios/:id
  static async buscarPorId(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ erro: 'Informe um bloqueio válido.' });
        return;
      }

      const bloqueio = await prisma.bloqueioAgenda.findUnique({
        where: { id },
        include: { profissional: { select: { id: true, nome: true } } },
      });
      if (!bloqueio) {
        res.status(404).json({ erro: 'Bloqueio não encontrado.' });
        return;
      }

      res.json(bloqueio);
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao buscar bloqueio.', detalhes: String(error) });
    }
  }

  // POST /bloqueios - Bloqueia um intervalo de horários na agenda do profissional
  static async criar(req: Request, res: Response): Promise<void> {
    try {
      const dados = bloqueioSchema.parse(req.body);
      const horarioInicio = dados.diaInteiro ? '00:00' : (dados.horarioInicio ?? '');
      const horarioFim = dados.diaInteiro ? '23:59' : (dados.horarioFim ?? '');

      const inicioMin = DisponibilidadeService.paraMinutos(horarioInicio);
      const fimMin = DisponibilidadeService.paraMinutos(horarioFim);

      if (fimMin <= inicioMin) {
        res.status(400).json({ erro: 'O horário de término deve ser maior que o horário de início.' });
        return;
      }

      if (dados.diaInteiro) {
        const agendamentos = await prisma.agendamento.count({
          where: {
            profissionalId: dados.profissionalId,
            data: dados.data,
            status: { in: ['PENDENTE', 'CONFIRMADO'] },
          },
        });
        if (agendamentos > 0) {
          res.status(409).json({ erro: 'Não é possível bloquear o dia inteiro: já existem agendamentos ativos nesta data.' });
          return;
        }
      }

      const bloqueio = await prisma.bloqueioAgenda.create({
        data: {
          profissionalId: dados.profissionalId,
          data: dados.data,
          horarioInicio,
          horarioFim,
          motivo: dados.motivo || (dados.diaInteiro ? 'Dia inteiro' : 'Horário bloqueado pelo profissional'),
        },
      });

      res.status(201).json({
        mensagem: 'Horário bloqueado com sucesso na agenda.',
        bloqueio,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ erro: 'Dados inválidos.', campos: error.errors });
        return;
      }
      res.status(500).json({ erro: 'Erro ao bloquear horário.', detalhes: String(error) });
    }
  }

  // PUT /bloqueios/:id - Atualiza um bloqueio manual
  static async editar(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ erro: 'Informe um bloqueio válido.' });
        return;
      }

      const existente = await prisma.bloqueioAgenda.findUnique({ where: { id } });
      if (!existente) {
        res.status(404).json({ erro: 'Bloqueio não encontrado para edição.' });
        return;
      }

      const dados = bloqueioSchema.parse(req.body);
      const horarioInicio = dados.diaInteiro ? '00:00' : (dados.horarioInicio ?? '');
      const horarioFim = dados.diaInteiro ? '23:59' : (dados.horarioFim ?? '');
      const inicioMin = DisponibilidadeService.paraMinutos(horarioInicio);
      const fimMin = DisponibilidadeService.paraMinutos(horarioFim);
      if (fimMin <= inicioMin) {
        res.status(400).json({ erro: 'O horário de término deve ser maior que o horário de início.' });
        return;
      }

      if (dados.diaInteiro) {
        const agendamentos = await prisma.agendamento.count({
          where: {
            profissionalId: dados.profissionalId,
            data: dados.data,
            status: { in: ['PENDENTE', 'CONFIRMADO'] },
          },
        });
        if (agendamentos > 0) {
          res.status(409).json({ erro: 'Não é possível bloquear o dia inteiro: já existem agendamentos ativos nesta data.' });
          return;
        }
      }

      const bloqueio = await prisma.bloqueioAgenda.update({
        where: { id },
        data: {
          profissionalId: dados.profissionalId,
          data: dados.data,
          horarioInicio,
          horarioFim,
          motivo: dados.motivo || (dados.diaInteiro ? 'Dia inteiro' : 'Horário bloqueado pelo profissional'),
        },
      });
      res.json({ mensagem: 'Bloqueio atualizado com sucesso.', bloqueio });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ erro: 'Dados inválidos.', campos: error.errors });
        return;
      }
      res.status(500).json({ erro: 'Erro ao editar bloqueio.', detalhes: String(error) });
    }
  }

  // DELETE /bloqueios/:id - Remove bloqueio manual
  static async remover(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const existente = await prisma.bloqueioAgenda.findUnique({ where: { id } });

      if (!existente) {
        res.status(404).json({ erro: 'Bloqueio não encontrado.' });
        return;
      }

      await prisma.bloqueioAgenda.delete({ where: { id } });
      res.json({ mensagem: 'Bloqueio removido com sucesso.' });
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao remover bloqueio.', detalhes: String(error) });
    }
  }
}
