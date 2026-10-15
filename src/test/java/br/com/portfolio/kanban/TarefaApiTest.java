package br.com.portfolio.kanban;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.http.MediaType;
import com.fasterxml.jackson.databind.ObjectMapper;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {"spring.datasource.url=jdbc:h2:mem:test;DB_CLOSE_DELAY=-1", "spring.datasource.username=sa", "spring.datasource.password=", "spring.jpa.hibernate.ddl-auto=create-drop"})
@AutoConfigureMockMvc
class TarefaApiTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Test void crudPersisteMudancaDeStatus() throws Exception {
        String json = "{\"titulo\":\"Estudar Java\",\"descricao\":\"Spring Boot\",\"status\":\"A_FAZER\",\"prioridade\":\"ALTA\",\"prazo\":null}";
        String result = mvc.perform(post("/tarefas").contentType(MediaType.APPLICATION_JSON).content(json)).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        long id = mapper.readTree(result).get("id").asLong();
        mvc.perform(get("/tarefas/" + id)).andExpect(status().isOk()).andExpect(jsonPath("$.titulo").value("Estudar Java"));
        mvc.perform(put("/tarefas/" + id).contentType(MediaType.APPLICATION_JSON).content(json.replace("A_FAZER", "CONCLUIDO"))).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("CONCLUIDO"));
        mvc.perform(get("/tarefas/" + id)).andExpect(jsonPath("$.status").value("CONCLUIDO"));
        mvc.perform(delete("/tarefas/" + id)).andExpect(status().isNoContent());
        mvc.perform(get("/tarefas/" + id)).andExpect(status().isNotFound());
    }
    @Test void rejeitaTituloVazioEStatusInvalido() throws Exception {
        mvc.perform(post("/tarefas").contentType(MediaType.APPLICATION_JSON).content("{\"titulo\":\"  \",\"status\":\"A_FAZER\",\"prioridade\":\"MEDIA\"}")).andExpect(status().isBadRequest());
        mvc.perform(post("/tarefas").contentType(MediaType.APPLICATION_JSON).content("{\"titulo\":\"Teste\",\"status\":\"INVALIDO\",\"prioridade\":\"MEDIA\"}")).andExpect(status().isBadRequest());
    }
    @Test void historicoRegistraMudancasReaisEPreservaExclusao() throws Exception {
        String json = "{\"titulo\":\"Histórico de teste\",\"descricao\":\"Antes\",\"status\":\"A_FAZER\",\"prioridade\":\"MEDIA\",\"prazo\":null}";
        String result = mvc.perform(post("/tarefas").contentType(MediaType.APPLICATION_JSON).content(json)).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        long id = mapper.readTree(result).get("id").asLong();
        String historyUrl = "/tarefas/" + id + "/historico";
        mvc.perform(get(historyUrl)).andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(1))
            .andExpect(jsonPath("$[0].evento").value("CRIACAO"))
            .andExpect(jsonPath("$[0].registradaEm").isNotEmpty());
        mvc.perform(put("/tarefas/" + id).contentType(MediaType.APPLICATION_JSON).content(json)).andExpect(status().isOk());
        mvc.perform(get(historyUrl)).andExpect(jsonPath("$.length()").value(1));
        String updated = json.replace("A_FAZER", "EM_ANDAMENTO").replace("Antes", "Depois");
        mvc.perform(put("/tarefas/" + id).contentType(MediaType.APPLICATION_JSON).content(updated)).andExpect(status().isOk());
        String history = mvc.perform(get(historyUrl)).andExpect(jsonPath("$.length()").value(2))
            .andExpect(jsonPath("$[0].evento").value("ALTERACAO")).andReturn().getResponse().getContentAsString();
        var entry = mapper.readTree(history).get(0);
        org.junit.jupiter.api.Assertions.assertEquals("A_FAZER", mapper.readTree(entry.get("antes").asText()).get("status").asText());
        org.junit.jupiter.api.Assertions.assertEquals("EM_ANDAMENTO", mapper.readTree(entry.get("depois").asText()).get("status").asText());
        org.junit.jupiter.api.Assertions.assertEquals("Depois", mapper.readTree(entry.get("depois").asText()).get("descricao").asText());
        mvc.perform(put("/tarefas/" + id).contentType(MediaType.APPLICATION_JSON).content(updated.replace("Histórico de teste", ""))).andExpect(status().isBadRequest());
        mvc.perform(get(historyUrl)).andExpect(jsonPath("$.length()").value(2));
        mvc.perform(delete("/tarefas/" + id)).andExpect(status().isNoContent());
        mvc.perform(get(historyUrl)).andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(3))
            .andExpect(jsonPath("$[0].evento").value("EXCLUSAO"))
            .andExpect(jsonPath("$[0].tarefaOriginalId").value(id));
        mvc.perform(get("/historico")).andExpect(status().isOk()).andExpect(jsonPath("$").isArray());
    }
}
