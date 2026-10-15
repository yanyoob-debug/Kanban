-- Consultas de verificação; não alteram dados.
USE kanban;
SHOW TABLES;
SHOW CREATE TABLE tarefas;

SELECT t.id, t.titulo, t.descricao,
       s.nome AS etapa, p.nome AS prioridade,
       t.prazo, t.criada_em, t.atualizada_em
FROM tarefas t
JOIN status_tarefa s ON s.codigo = t.status
JOIN prioridades p ON p.codigo = t.prioridade
ORDER BY t.criada_em DESC;

SELECT s.nome AS etapa, COUNT(t.id) AS total_tarefas
FROM status_tarefa s
LEFT JOIN tarefas t ON t.status = s.codigo
GROUP BY s.codigo, s.nome, s.ordem
ORDER BY s.ordem;

SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME,
       REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'kanban' AND REFERENCED_TABLE_NAME IS NOT NULL;
