import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { configuracaoPadrao, obterConfiguracao } from '../services/ConfiguracaoService';

const horarioSchema = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, 'Use o formato HH:mm.');
const horarioDiaSchema = z.object({
  open: z.boolean(),
  start: horarioSchema,
  lunchStart: horarioSchema,
  lunchEnd: horarioSchema,
  end: horarioSchema,
}).superRefine((day, context) => {
  if (!day.open) return;

  const toMinutes = (value: string) => {
    const [hour, minute] = value.split(':').map(Number);
    return hour * 60 + minute;
  };
  const start = toMinutes(day.start);
  const lunchStart = toMinutes(day.lunchStart);
  const lunchEnd = toMinutes(day.lunchEnd);
  const end = toMinutes(day.end);

  if (start >= end) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['end'], message: 'O fechamento deve ser depois da abertura.' });
  }
  if (lunchStart < start || lunchEnd < lunchStart || lunchEnd > end) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['lunchStart'], message: 'O intervalo deve ficar dentro do expediente.' });
  }
});

const configuracaoSchema = z.object({
  nome: z.string().trim().min(2, 'O nome do estabelecimento deve ter pelo menos 2 caracteres.').optional(),
  telefone: z.string().trim().optional(),
  instagram: z.string().trim().optional(),
  endereco: z.string().trim().optional(),
  mensagem: z.string().trim().max(160).optional(),
  horario: z.string().trim().optional(),
  horariosSemana: z.array(horarioDiaSchema).length(7).optional(),
  intervaloMinutos: z.union([z.literal(15), z.literal(30), z.literal(45), z.literal(60)]).optional(),
  antecedenciaMinutos: z.union([z.literal(0), z.literal(30), z.literal(60), z.literal(120), z.literal(1440)]).optional(),
  politicaCancelamentoHoras: z.union([z.literal(1), z.literal(2), z.literal(4), z.literal(24)]).optional(),
  confirmacaoAutomatica: z.boolean().optional(),
  lembretesWhatsapp: z.boolean().optional(),
});

export class ConfiguracaoController {
  static async buscar(_req: Request, res: Response): Promise<void> {
    try {
      res.json(await obterConfiguracao());
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao carregar configurações.', detalhes: String(error) });
    }
  }

  static async atualizar(req: Request, res: Response): Promise<void> {
    try {
      const resultado = configuracaoSchema.safeParse(req.body);
      if (!resultado.success) {
        res.status(400).json({ erro: 'Dados inválidos para as configurações.', campos: resultado.error.errors });
        return;
      }

      const { horariosSemana, ...fields } = resultado.data;
      const dadosBanco = {
        ...fields,
        ...(horariosSemana ? { horariosSemana: JSON.stringify(horariosSemana) } : {}),
      };
      const configuracao = await prisma.configuracao.upsert({
        where: { id: 1 },
        create: {
          ...configuracaoPadrao,
          horariosSemana: JSON.stringify(configuracaoPadrao.horariosSemana),
          ...dadosBanco,
        },
        update: dadosBanco,
      });
      res.json(await obterConfiguracao());
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao atualizar configurações.', detalhes: String(error) });
    }
  }
}
