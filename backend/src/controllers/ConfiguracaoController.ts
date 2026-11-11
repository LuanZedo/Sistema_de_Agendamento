import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';

const configuracaoSchema = z.object({
  nome: z.string().trim().min(2, 'O nome do estabelecimento deve ter pelo menos 2 caracteres.').optional(),
  telefone: z.string().trim().optional(),
  horario: z.string().trim().optional(),
});

const configuracaoPadrao = {
  id: 1,
  nome: 'HoraCerta',
  telefone: '',
  horario: '08:00-18:00',
};

export class ConfiguracaoController {
  static async buscar(_req: Request, res: Response): Promise<void> {
    try {
      const configuracao = await prisma.configuracao.findUnique({ where: { id: 1 } });
      res.json(configuracao ?? configuracaoPadrao);
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

      const configuracao = await prisma.configuracao.upsert({
        where: { id: 1 },
        create: { ...configuracaoPadrao, ...resultado.data },
        update: resultado.data,
      });
      res.json(configuracao);
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao atualizar configurações.', detalhes: String(error) });
    }
  }
}
