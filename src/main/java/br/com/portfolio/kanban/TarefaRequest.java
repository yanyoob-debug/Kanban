package br.com.portfolio.kanban;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record TarefaRequest(
    @NotBlank @Size(max = 120) String titulo,
    @Size(max = 2000) String descricao,
    @NotNull Status status,
    @NotNull Prioridade prioridade,
    LocalDate prazo
) {}
