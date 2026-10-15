package br.com.portfolio.kanban;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.junit.jupiter.api.Assertions.assertEquals;

@ActiveProfiles("mysql")
@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:history-init;MODE=MySQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.username=sa", "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=validate",
    "spring.sql.init.schema-locations=classpath:history-base-test.sql,classpath:db/history.sql,classpath:db/history.sql"
})
@AutoConfigureMockMvc
class HistoricoInicializacaoTest {
    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Test void criaHistoricoSemApagarTarefasEPermiteReexecutarScript() throws Exception {
        mvc.perform(get("/tarefas/88")).andExpect(status().isOk()).andExpect(jsonPath("$.titulo").value("Tarefa existente"));
        mvc.perform(get("/historico")).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(post("/tarefas").contentType(MediaType.APPLICATION_JSON)
            .content("{\"titulo\":\"Teste de inicialização\",\"status\":\"A_FAZER\",\"prioridade\":\"MEDIA\"}"))
            .andExpect(status().isCreated());
        mvc.perform(get("/historico")).andExpect(status().isOk()).andExpect(jsonPath("$[0].evento").value("CRIACAO"));
        assertEquals(2, jdbc.queryForObject("SELECT COUNT(*) FROM tarefas", Integer.class));
    }
}
