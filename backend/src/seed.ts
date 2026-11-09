import { prisma } from './config/prisma';

async function main() {
  console.log('🌱 Iniciando seed do banco de dados HoraCerta...');

  // Limpa registros existentes em ordem de dependência
  await prisma.agendamento.deleteMany();
  await prisma.bloqueioAgenda.deleteMany();
  await prisma.servico.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.profissional.deleteMany();

  // 1. Profissionais do Protótipo (Tela 2)
  const lucas = await prisma.profissional.create({
    data: {
      nome: 'Lucas Almeida',
      telefone: '(11) 98888-0001',
      email: 'lucas@horacerta.com.br',
      avaliacao: 4.9,
      totalAtendimentos: 128,
      horarioInicioExpediente: '08:00',
      horarioFimExpediente: '18:00',
    },
  });

  const rafael = await prisma.profissional.create({
    data: {
      nome: 'Rafael Souza',
      telefone: '(11) 98888-0002',
      email: 'rafael@horacerta.com.br',
      avaliacao: 4.8,
      totalAtendimentos: 96,
      horarioInicioExpediente: '08:00',
      horarioFimExpediente: '18:00',
    },
  });

  const carlos = await prisma.profissional.create({
    data: {
      nome: 'Carlos Mendes',
      telefone: '(11) 98888-0003',
      email: 'carlos@horacerta.com.br',
      avaliacao: 4.7,
      totalAtendimentos: 74,
      horarioInicioExpediente: '08:00',
      horarioFimExpediente: '18:00',
    },
  });

  // 2. Serviços do Protótipo (Tela 1)
  const corteMasculino = await prisma.servico.create({
    data: {
      nome: 'Corte Masculino',
      descricao: 'Corte social ou degradê na máquina e tesoura com finalização.',
      preco: 40.0,
      duracao: 30,
      ativo: true,
    },
  });

  const barba = await prisma.servico.create({
    data: {
      nome: 'Barba',
      descricao: 'Modelagem completa de barba com toalha quente e navalha.',
      preco: 30.0,
      duracao: 20,
      ativo: true,
    },
  });

  const corteBarba = await prisma.servico.create({
    data: {
      nome: 'Corte + Barba',
      descricao: 'Combo completo de corte masculino e barba alinhada.',
      preco: 65.0,
      duracao: 50,
      ativo: true,
    },
  });

  // 3. Clientes do Protótipo (Telas 2, 3 e 4)
  const joaoSilva = await prisma.cliente.create({
    data: {
      nome: 'João Silva',
      telefone: '(11) 99999-1234',
      email: 'joao.silva@email.com',
    },
  });

  const marcosLima = await prisma.cliente.create({
    data: {
      nome: 'Marcos Lima',
      telefone: '(11) 99999-2222',
      email: 'marcos.lima@email.com',
    },
  });

  const pedroAlves = await prisma.cliente.create({
    data: {
      nome: 'Pedro Alves',
      telefone: '(11) 99999-3333',
      email: 'pedro.alves@email.com',
    },
  });

  const carlosRocha = await prisma.cliente.create({
    data: {
      nome: 'Carlos Rocha',
      telefone: '(11) 99999-4444',
      email: 'carlos.rocha@email.com',
    },
  });

  // 4. Agendamentos da Semana (Tela 3 - Semana de 10 a 16 de nov. de 2025 para Lucas Almeida)
  await prisma.agendamento.createMany({
    data: [
      {
        data: '2025-11-11',
        horario: '09:30',
        horarioFim: '10:00',
        status: 'CONFIRMADO',
        clienteId: marcosLima.id,
        profissionalId: lucas.id,
        servicoId: corteMasculino.id,
      },
      {
        data: '2025-11-11',
        horario: '14:00',
        horarioFim: '14:50',
        status: 'CONFIRMADO',
        clienteId: carlosRocha.id,
        profissionalId: lucas.id,
        servicoId: corteBarba.id,
      },
      {
        data: '2025-11-12',
        horario: '10:00',
        horarioFim: '10:20',
        status: 'PENDENTE',
        clienteId: pedroAlves.id,
        profissionalId: lucas.id,
        servicoId: barba.id,
      },
      {
        data: '2025-11-12',
        horario: '11:00',
        horarioFim: '11:30',
        status: 'CONFIRMADO',
        clienteId: joaoSilva.id,
        profissionalId: lucas.id,
        servicoId: corteMasculino.id,
      },
    ],
  });

  console.log('✅ Seed concluído com sucesso!');
  console.log(`   - 3 Profissionais criados (${lucas.nome}, ${rafael.nome}, ${carlos.nome})`);
  console.log(`   - 3 Serviços criados (${corteMasculino.nome}, ${barba.nome}, ${corteBarba.nome})`);
  console.log(`   - 4 Clientes e 4 Agendamentos iniciais criados conforme Protótipo.`);
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
