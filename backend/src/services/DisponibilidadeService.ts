/**
 * Serviço responsável pelos cálculos de horários, duração de serviços e
 * detecção de choque de agenda (RF02 e RF04).
 */
export interface IntervaloOcupado {
  horarioInicio: string; // "HH:mm"
  horarioFim: string;    // "HH:mm"
  origem?: 'AGENDAMENTO' | 'BLOQUEIO';
  referenciaId?: number;
}

export interface SlotHorario {
  horario: string;       // "HH:mm"
  horarioFim: string;    // "HH:mm"
  disponivel: boolean;
  motivoIndisponibilidade?: string;
}

export class DisponibilidadeService {
  /**
   * Converte uma string "HH:mm" para total de minutos desde 00:00.
   */
  static paraMinutos(horario: string): number {
    const [horasStr, minutosStr] = horario.split(':');
    const horas = Number(horasStr);
    const minutos = Number(minutosStr);
    if (
      Number.isNaN(horas) ||
      Number.isNaN(minutos) ||
      horas < 0 ||
      horas > 23 ||
      minutos < 0 ||
      minutos > 59
    ) {
      throw new Error(`Formato de horário inválido: "${horario}". Use HH:mm.`);
    }
    return horas * 60 + minutos;
  }

  /**
   * Converte total de minutos desde 00:00 para string "HH:mm".
   */
  static paraHorarioString(totalMinutos: number): string {
    const horas = Math.floor(totalMinutos / 60);
    const minutos = totalMinutos % 60;
    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
  }

  /**
   * Calcula o horário de término somando a duração (em minutos) ao horário inicial.
   */
  static calcularHorarioFim(horarioInicio: string, duracaoMinutos: number): string {
    const inicioMin = this.paraMinutos(horarioInicio);
    return this.paraHorarioString(inicioMin + duracaoMinutos);
  }

  /**
   * Verifica se dois intervalos [inicioA, fimA) e [inicioB, fimB) possuem choque (RF04).
   * Fórmula matemática de interseção: InicioA < FimB && FimA > InicioB
   */
  static possuiConflito(
    inicioA: string,
    fimA: string,
    inicioB: string,
    fimB: string
  ): boolean {
    const aInicio = this.paraMinutos(inicioA);
    const aFim = this.paraMinutos(fimA);
    const bInicio = this.paraMinutos(inicioB);
    const bFim = this.paraMinutos(fimB);

    return aInicio < bFim && aFim > bInicio;
  }

  /**
   * Verifica se um novo intervalo [horarioInicio, horarioFim) conflita com qualquer
   * intervalo já ocupado na agenda do profissional.
   */
  static verificarChoqueNaAgenda(
    horarioInicio: string,
    horarioFim: string,
    ocupados: IntervaloOcupado[]
  ): IntervaloOcupado | null {
    for (const item of ocupados) {
      if (this.possuiConflito(horarioInicio, horarioFim, item.horarioInicio, item.horarioFim)) {
        return item;
      }
    }
    return null;
  }

  /**
   * Gera a grade de horários do dia (de 30 em 30 minutos por padrão, como na Tela 2)
   * indicando quais horários estão disponíveis e quais estão bloqueados/ocupados.
   */
  static gerarGradeHorarios(params: {
    inicioExpediente: string;
    fimExpediente: string;
    duracaoServicoMinutos: number;
    ocupados: IntervaloOcupado[];
    passoMinutos?: number;
  }): SlotHorario[] {
    const passo = params.passoMinutos ?? 30;
    const inicioExpMin = this.paraMinutos(params.inicioExpediente);
    const fimExpMin = this.paraMinutos(params.fimExpediente);
    const slots: SlotHorario[] = [];

    for (
      let atualMin = inicioExpMin;
      atualMin + params.duracaoServicoMinutos <= fimExpMin;
      atualMin += passo
    ) {
      const horario = this.paraHorarioString(atualMin);
      const horarioFim = this.paraHorarioString(atualMin + params.duracaoServicoMinutos);

      const conflito = this.verificarChoqueNaAgenda(horario, horarioFim, params.ocupados);

      slots.push({
        horario,
        horarioFim,
        disponivel: conflito === null,
        ...(conflito
          ? {
              motivoIndisponibilidade:
                conflito.origem === 'BLOQUEIO'
                  ? 'Horário bloqueado pelo profissional'
                  : `Conflito com atendimento das ${conflito.horarioInicio} às ${conflito.horarioFim}`,
            }
          : {}),
      });
    }

    return slots;
  }
}
