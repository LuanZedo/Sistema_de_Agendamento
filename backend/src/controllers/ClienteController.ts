import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

export class ClienteController {
  // GET /clientes - Lista clientes cadastrados e histórico de agendamentos
  static async listar(req: Request, res: Response): Promise<void> {
    try {
      const { telefone } = req.query;
      const where: Record<string, unknown> = {};
      if (telefone) where.telefone = String(telefone);

      const clientes = await prisma.cliente.findMany({
        where,
        include: {
          agendamentos: {
            include: { servico: true, profissional: { select: { id: true, nome: true } } },
            orderBy: [{ data: 'desc' }, { horario: 'desc' }],
          },
        },
        orderBy: { nome: 'asc' },
      });

      res.json(clientes);
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao listar clientes.', detalhes: String(error) });
    }
  }
}
