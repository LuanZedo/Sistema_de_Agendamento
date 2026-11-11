-- ============================================================================
-- SISTEMA HORACERTA - SCRIPT DDL (CRIAÇÃO DO BANCO DE DADOS)
-- Equipe: Michel Vieira, Hugo Braga, Pedro Henrique, Luan Azevedo, Hugo Ferreira
-- ============================================================================

-- 1. Tabela de Profissionais (Prestadores / Administradores)
CREATE TABLE IF NOT EXISTS profissionais (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(120) NOT NULL,
    telefone VARCHAR(30) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    avaliacao DECIMAL(3, 2) NOT NULL DEFAULT 5.00,
    total_atendimentos INTEGER NOT NULL DEFAULT 0,
    horario_inicio_expediente CHAR(5) NOT NULL DEFAULT '08:00',
    horario_fim_expediente CHAR(5) NOT NULL DEFAULT '18:00',
    ativo BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de Serviços (RF01: nome, descrição, preço e duração estimada em minutos)
CREATE TABLE IF NOT EXISTS servicos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(100) NOT NULL,
    descricao VARCHAR(255) NOT NULL DEFAULT '',
    preco DECIMAL(10, 2) NOT NULL CHECK (preco >= 0),
    duracao INTEGER NOT NULL CHECK (duracao > 0), -- Duração em minutos (ex: 30, 20, 50)
    ativo BOOLEAN NOT NULL DEFAULT 1,
    profissional_id INTEGER NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_servico_profissional
        FOREIGN KEY (profissional_id) REFERENCES profissionais(id)
        ON DELETE SET NULL
);

-- 3. Tabela de Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(120) NOT NULL,
    telefone VARCHAR(30) NOT NULL UNIQUE, -- WhatsApp utilizado no formulário público
    email VARCHAR(150) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabela de Agendamentos (RF02, RF03, RF04, RF05)
CREATE TABLE IF NOT EXISTS agendamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data DATE NOT NULL,                      -- Formato YYYY-MM-DD
    horario CHAR(5) NOT NULL,                -- Horário de início (HH:mm)
    horario_fim CHAR(5) NOT NULL,            -- Horário de término calculado (HH:mm)
    status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMADO'
        CHECK (status IN ('PENDENTE', 'CONFIRMADO', 'CANCELADO')),
    cancelado_por VARCHAR(20) NULL
        CHECK (cancelado_por IN ('CLIENTE', 'PROFISSIONAL') OR cancelado_por IS NULL),
    motivo_cancelamento VARCHAR(255) NULL,
    observacoes VARCHAR(255) NULL,
    cliente_id INTEGER NOT NULL,
    profissional_id INTEGER NOT NULL,
    servico_id INTEGER NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_agendamento_cliente
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    CONSTRAINT fk_agendamento_profissional
        FOREIGN KEY (profissional_id) REFERENCES profissionais(id) ON DELETE CASCADE,
    CONSTRAINT fk_agendamento_servico
        FOREIGN KEY (servico_id) REFERENCES servicos(id) ON DELETE RESTRICT
);

-- 5. Tabela de Bloqueios Manuais de Agenda (Caso de Uso: Bloquear horários ocupados)
CREATE TABLE IF NOT EXISTS bloqueios_agenda (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data DATE NOT NULL,
    horario_inicio CHAR(5) NOT NULL,
    horario_fim CHAR(5) NOT NULL,
    motivo VARCHAR(255) NOT NULL DEFAULT 'Horário bloqueado pelo profissional',
    profissional_id INTEGER NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bloqueio_profissional
        FOREIGN KEY (profissional_id) REFERENCES profissionais(id) ON DELETE CASCADE
);

-- 6. Configurações gerais do estabelecimento
CREATE TABLE IF NOT EXISTS configuracoes (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    nome VARCHAR(120) NOT NULL DEFAULT 'HoraCerta',
    telefone VARCHAR(30) NOT NULL DEFAULT '',
    horario VARCHAR(100) NOT NULL DEFAULT '08:00-18:00'
);

-- Índices para Desempenho (RNF02: Carregamento < 2s sob 4G/5G)
CREATE INDEX IF NOT EXISTS idx_agendamentos_prof_data_status
    ON agendamentos(profissional_id, data, status);

CREATE INDEX IF NOT EXISTS idx_agendamentos_cliente_data
    ON agendamentos(cliente_id, data);

CREATE INDEX IF NOT EXISTS idx_bloqueios_prof_data
    ON bloqueios_agenda(profissional_id, data);
