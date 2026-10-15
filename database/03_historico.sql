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

