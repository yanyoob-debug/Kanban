CREATE TABLE tarefas (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(120) NOT NULL,
    descricao VARCHAR(2000),
    status VARCHAR(24) NOT NULL,
    prioridade VARCHAR(12) NOT NULL,
    prazo DATE,
    criada_em DATETIME(6) NOT NULL,
    atualizada_em DATETIME(6) NOT NULL
);
INSERT INTO tarefas (id, titulo, status, prioridade, criada_em, atualizada_em)
VALUES (88, 'Tarefa existente', 'A_FAZER', 'MEDIA', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
