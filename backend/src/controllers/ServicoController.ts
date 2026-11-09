import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';

const servicoSchema = z.object({
  nome: z.string().min(2, 'O nome do serviço deve ter pelo menos 2 caracteres.'),
  descricao: z.string().optional().default(''),
  preco: z.number().nonnegative('O preço não pode ser negativo.'),
  duracao: z.number().int().positive('A duração (em minutos) deve ser maior que zero.'),
  ativo: z.boolean().optional().default(true),
  profissionalId: z.number().int().positive().nullable().optional(),
});

const atualizarServicoSchema = servicoSchema.partial();

/**
 * Controller de Serviços - Implementa RF01 e os métodos da classe Servico no Diagrama UML:
 * +listar(), +cadastrar(), +editar()
 */
export class ServicoController {
  // GET /servicos - RF01: Listagem de serviços oferecidos (nome, preço e duração estimada)
  static async listar(req: Request, res: Response): Promise<void> {
    try {
      const { apenasAtivos, profissionalId } = req.query;

      const where: Record<string, unknown> = {};
      if (apenasAtivos !== 'false') {
        where.ativo = true;
      }
      if (profissionalId) {
        where.OR = [
          { profissionalId: Number(profissionalId) },
          { profissionalId: null },
        ];
      }

      const servicos = await prisma.servico.findMany({
        where,
        include: {
          profissional: {
            select: { id: true, nome: true },
          },
        },
        orderBy: { id: 'asc' },
      });

      res.json(servicos);
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao listar serviços.', detalhes: String(error) });
    }
  }

  // GET /servicos/:id
  static async buscarPorId(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const servico = await prisma.servico.findUnique({
        where: { id },
        include: { profissional: { select: { id: true, nome: true } } },
      });

      if (!servico) {
        res.status(404).json({ erro: 'Serviço não encontrado.' });
        return;
      }

      res.json(servico);
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao buscar serviço.', detalhes: String(error) });
    }
  }

  // POST /servicos - RF01: Cadastro de novo serviço
  static async cadastrar(req: Request, res: Response): Promise<void> {
    try {
      const dados = servicoSchema.parse(req.body);

      const novoServico = await prisma.servico.create({
        data: {
          nome: dados.nome,
          descricao: dados.descricao,
          preco: dados.preco,
          duracao: dados.duracao,
          ativo: dados.ativo,
          profissionalId: dados.profissionalId ?? null,
        },
      });

      res.status(201).json(novoServico);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ erro: 'Dados inválidos para cadastro de serviço.', campos: error.errors });
        return;
      }
      res.status(500).json({ erro: 'Erro ao cadastrar serviço.', detalhes: String(error) });
    }
  }

  // PUT /servicos/:id - RF01: Edição de serviço existente
  static async editar(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const dados = atualizarServicoSchema.parse(req.body);

      const existente = await prisma.servico.findUnique({ where: { id } });
      if (!existente) {
        res.status(404).json({ erro: 'Serviço não encontrado para edição.' });
        return;
      }

      const servicoAtualizado = await prisma.servico.update({
        where: { id },
        data: dados,
      });

      res.json(servicoAtualizado);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ erro: 'Dados inválidos para edição de serviço.', campos: error.errors });
        return;
      }
      res.status(500).json({ erro: 'Erro ao editar serviço.', detalhes: String(error) });
    }
  }
}
