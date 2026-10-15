-- Execute em uma conexão MySQL 8 no host localhost, porta 3306.
-- Execute como SCRIPT: no DBeaver use Alt+X (Executar script SQL).
-- Para executar como instrução, selecione apenas UM comando até seu ponto e vírgula.
-- Cria a estrutura sem apagar tabelas ou tarefas existentes.
CREATE DATABASE IF NOT EXISTS kanban
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE kanban;

CREATE TABLE IF NOT EXISTS status_tarefa (
    codigo VARCHAR(24) NOT NULL,
    nome VARCHAR(40) NOT NULL,
    ordem TINYINT UNSIGNED NOT NULL,
    PRIMARY KEY (codigo),
    UNIQUE KEY uk_status_ordem (ordem)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS prioridades (
    codigo VARCHAR(12) NOT NULL,
    nome VARCHAR(20) NOT NULL,
    ordem TINYINT UNSIGNED NOT NULL,
    PRIMARY KEY (codigo),
    UNIQUE KEY uk_prioridade_ordem (ordem)
) ENGINE=InnoDB;

INSERT INTO status_tarefa (codigo, nome, ordem) VALUES
    ('A_FAZER', 'A Fazer', 1),
    ('EM_ANDAMENTO', 'Em Andamento', 2),
    ('CONCLUIDO', 'Concluído', 3)
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

INSERT INTO prioridades (codigo, nome, ordem) VALUES
    ('BAIXA', 'Baixa', 1),
    ('MEDIA', 'Média', 2),
    ('ALTA', 'Alta', 3)
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

CREATE TABLE IF NOT EXISTS tarefas (
    id BIGINT NOT NULL AUTO_INCREMENT,
    titulo VARCHAR(120) NOT NULL,
    descricao VARCHAR(2000) NULL,
    status VARCHAR(24) NOT NULL,
    prioridade VARCHAR(12) NOT NULL,
    prazo DATE NULL,
    criada_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    atualizada_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_tarefas_status (status),
    KEY idx_tarefas_prioridade (prioridade),
    KEY idx_tarefas_prazo (prazo),
    KEY idx_tarefas_criada_em (criada_em),
    CONSTRAINT fk_tarefas_status FOREIGN KEY (status)
        REFERENCES status_tarefa (codigo)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_tarefas_prioridade FOREIGN KEY (prioridade)
        REFERENCES prioridades (codigo)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT ck_tarefas_titulo CHECK (CHAR_LENGTH(TRIM(titulo)) > 0)
) ENGINE=InnoDB;

-- Banco existente: execute este script antes de reiniciar a aplicação.
-- DBeaver: Alt+X (Executar script SQL).
USE kanban;

CREATE TABLE IF NOT EXISTS historico_tarefas (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tarefa_id BIGINT NULL,
    tarefa_original_id BIGINT NOT NULL,
    titulo_tarefa VARCHAR(120) NOT NULL,
    evento VARCHAR(20) NOT NULL,
    antes TEXT NULL,
    depois TEXT NULL,
    registrada_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_historico_tarefa (tarefa_id),
    KEY idx_historico_original_data (tarefa_original_id, registrada_em, id),
    KEY idx_historico_data (registrada_em, id),
    CONSTRAINT fk_historico_tarefa FOREIGN KEY (tarefa_id)
        REFERENCES tarefas (id) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE=InnoDB;

-- A referência atual fica nula ao excluir a tarefa; o ID original e os dados
-- anteriores continuam no histórico. Alterações anteriores à instalação
-- desta funcionalidade e feitas diretamente por SQL não são registradas.


