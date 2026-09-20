package app.mithila.makaranda.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class ApiSmokeTest {

  @Autowired MockMvc mvc;

  @Test void healthIsUp() throws Exception {
    mvc.perform(get("/api/v1/health"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("UP"));
  }

  @Test void profilesContract() throws Exception {
    mvc.perform(get("/api/v1/profiles"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.defaultProfile").value("makaranda-v1"))
        .andExpect(jsonPath("$.profiles['drik-v1'].ayanamsaDefault").value("LAHIRI_CITRA"));
  }

  @Test void enginesAreIsolatedAndBothPresent() throws Exception {
    mvc.perform(get("/api/v1/engines"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(2));
  }
}
