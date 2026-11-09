-- ============================================================================
-- SISTEMA HORACERTA - DADOS INICIAIS (SEED BASEADO NO PROTÓTIPO DE TELAS)
-- ============================================================================

-- 1. Profissionais (Exatamente como na Tela 2 do Protótipo)
INSERT INTO profissionais (id, nome, telefone, email, avaliacao, total_atendimentos, horario_inicio_expediente, horario_fim_expediente, ativo)
VALUES
    (1, 'Lucas Almeida', '(11) 98888-0001', 'lucas@horacerta.com.br', 4.9, 128, '08:00', '18:00', 1),
    (2, 'Rafael Souza', '(11) 98888-0002', 'rafael@horacerta.com.br', 4.8, 96, '08:00', '18:00', 1),
    (3, 'Carlos Mendes', '(11) 98888-0003', 'carlos@horacerta.com.br', 4.7, 74, '08:00', '18:00', 1);

-- 2. Serviços (Exatamente como na Tela 1 do Protótipo)
INSERT INTO servicos (id, nome, descricao, preco, duracao, ativo, profissional_id)
VALUES
    (1, 'Corte Masculino', 'Corte social ou degradê na máquina e tesoura com finalização.', 40.00, 30, 1, NULL),
    (2, 'Barba', 'Modelagem completa de barba com toalha quente e navalha.', 30.00, 20, 1, NULL),
    (3, 'Corte + Barba', 'Combo completo de corte masculino e barba alinhada.', 65.00, 50, 1, NULL);

-- 3. Clientes (Exatamente como nas Telas 2, 3 e 4 do Protótipo)
INSERT INTO clientes (id, nome, telefone, email)
VALUES
    (1, 'João Silva', '(11) 99999-1234', 'joao.silva@email.com'),
    (2, 'Marcos Lima', '(11) 99999-2222', 'marcos.lima@email.com'),
    (3, 'Pedro Alves', '(11) 99999-3333', 'pedro.alves@email.com'),
    (4, 'Carlos Rocha', '(11) 99999-4444', 'carlos.rocha@email.com');

-- 4. Agendamentos da Semana (Exatamente como na Tela 3: 10 - 16 de nov. de 2025 para Lucas Almeida)
INSERT INTO agendamentos (id, data, horario, horario_fim, status, cliente_id, profissional_id, servico_id)
VALUES
    (1, '2025-11-11', '09:30', '10:00', 'CONFIRMADO', 2, 1, 1), -- Marcos Lima (Corte - Terça 11/11 09:30)
    (2, '2025-11-11', '14:00', '14:50', 'CONFIRMADO', 4, 1, 3), -- Carlos Rocha (Corte + Barba - Terça 11/11 14:00)
    (3, '2025-11-12', '10:00', '10:20', 'PENDENTE',   3, 1, 2), -- Pedro Alves (Barba - Quarta 12/11 10:00)
    (4, '2025-11-12', '11:00', '11:30', 'CONFIRMADO', 1, 1, 1); -- João Silva (Corte Masculino - Quarta 12/11 11:00)
