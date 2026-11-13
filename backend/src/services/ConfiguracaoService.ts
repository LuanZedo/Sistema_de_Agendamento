import { prisma } from '../config/prisma';

export interface HorarioFuncionamento {
  open: boolean;
  start: string;
  lunchStart: string;
  lunchEnd: string;
  end: string;
}

export interface Configuracao {
  id: number;
  nome: string;
  telefone: string;
  instagram: string;
  endereco: string;
  mensagem: string;
  horario: string;
  horariosSemana: HorarioFuncionamento[];
  intervaloMinutos: number;
  antecedenciaMinutos: number;
  politicaCancelamentoHoras: number;
  confirmacaoAutomatica: boolean;
  lembretesWhatsapp: boolean;
}

export const configuracaoPadrao: Configuracao = {
  id: 1,
  nome: 'HoraCerta',
  telefone: '',
  instagram: '@horacerta.barbearia',
  endereco: 'Av. Álvaro Otacílio, 1420 - Ponta Verde, Maceió - AL',
  mensagem: 'Cortes modernos, alinhamento de fios, barba na navalha e selagem capilar com hora marcada.',
  horario: '08:00-18:00',
  horariosSemana: [
    { open: true, start: '08:00', lunchStart: '12:00', lunchEnd: '13:00', end: '18:00' },
    { open: true, start: '08:00', lunchStart: '12:00', lunchEnd: '13:00', end: '18:00' },
    { open: true, start: '08:00', lunchStart: '12:00', lunchEnd: '13:00', end: '18:00' },
    { open: true, start: '08:00', lunchStart: '12:00', lunchEnd: '13:00', end: '18:00' },
    { open: true, start: '08:00', lunchStart: '12:00', lunchEnd: '13:00', end: '19:00' },
    { open: true, start: '08:00', lunchStart: '12:00', lunchEnd: '12:30', end: '17:00' },
    { open: false, start: '09:00', lunchStart: '12:00', lunchEnd: '13:00', end: '14:00' },
  ],
  intervaloMinutos: 30,
  antecedenciaMinutos: 0,
  politicaCancelamentoHoras: 2,
  confirmacaoAutomatica: true,
  lembretesWhatsapp: true,
};

function parseHorariosSemana(value: string): HorarioFuncionamento[] {
  const isHorarioFuncionamento = (day: unknown): day is HorarioFuncionamento => (
    typeof day === 'object'
    && day !== null
    && 'open' in day
    && typeof day.open === 'boolean'
    && 'start' in day
    && typeof day.start === 'string'
    && 'lunchStart' in day
    && typeof day.lunchStart === 'string'
    && 'lunchEnd' in day
    && typeof day.lunchEnd === 'string'
    && 'end' in day
    && typeof day.end === 'string'
  );

  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed) && parsed.length === 7 && parsed.every(isHorarioFuncionamento)) {
      return parsed;
    }
  } catch {
    return configuracaoPadrao.horariosSemana.map((day) => ({ ...day }));
  }
  return configuracaoPadrao.horariosSemana.map((day) => ({ ...day }));
}

export async function obterConfiguracao(): Promise<Configuracao> {
  const saved = await prisma.configuracao.findUnique({ where: { id: 1 } });
  if (!saved) {
    return {
      ...configuracaoPadrao,
      horariosSemana: configuracaoPadrao.horariosSemana.map((day) => ({ ...day })),
    };
  }

  const { horariosSemana, ...fields } = saved;
  return {
    ...configuracaoPadrao,
    ...fields,
    horariosSemana: parseHorariosSemana(horariosSemana),
  };
}

export function horarioFuncionamentoNaData(
  configuracao: Configuracao,
  data: string,
): HorarioFuncionamento {
  const [year, month, day] = data.split('-').map(Number);
  const diaSemana = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const indiceSegundaPrimeiro = (diaSemana + 6) % 7;
  return configuracao.horariosSemana[indiceSegundaPrimeiro];
}
