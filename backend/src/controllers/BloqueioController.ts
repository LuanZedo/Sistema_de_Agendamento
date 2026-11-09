import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { DisponibilidadeService } from '../services/DisponibilidadeService';

const bloqueioSchema = z.object({
  profissionalId: z.number().int().positive(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'A data deve estar no formato YYYY-MM-DD.'),
  horarioInicio: z.string().regex(/^\d{2}:\d{2}$/, 'Use o formato HH:mm.'),
  horarioFim: z.string().regex(/^\d{2}:\d{2}$/, 'Use o formato HH:mm.'),
  motivo: z.string().optional().default('Horário bloqueado pelo profissional'),
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

  // POST /bloqueios - Bloqueia um intervalo de horários na agenda do profissional
  static async criar(req: Request, res: Response): Promise<void> {
    try {
      const dados = bloqueioSchema.parse(req.body);

      const inicioMin = DisponibilidadeService.paraMinutos(dados.horarioInicio);
      const fimMin = DisponibilidadeService.paraMinutos(dados.horarioFim);

      if (fimMin <= inicioMin) {
        res.status(400).json({ erro: 'O horário de término deve ser maior que o horário de início.' });
        return;
      }

      const bloqueio = await prisma.bloqueioAgenda.create({
        data: dados,
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
