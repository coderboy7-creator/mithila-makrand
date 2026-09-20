package app.mithila.makaranda.api;

import app.mithila.makaranda.core.profile.ProfileRegistry;
import app.mithila.makaranda.core.spi.CalculationEngine;
import app.mithila.makaranda.core.spi.EngineDescriptor;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class ApiControllers {

  private final List<CalculationEngine> engines;

  public ApiControllers(List<CalculationEngine> engines) { this.engines = engines; }

  @GetMapping("/health")
  public Map<String, Object> health() {
    return Map.of(
        "status", "UP",
        "jdk", System.getProperty("java.version"),
        "app", "mithila-makaranda-jvm");
  }

  @GetMapping("/engines")
  public List<EngineDescriptor> engines() {
    return engines.stream().map(CalculationEngine::descriptor).toList();
  }

  /** Same contract as the Node server's GET /api/v1/profiles. */
  @GetMapping("/profiles")
  public Map<String, Object> profiles() {
    Map<String, Object> out = new LinkedHashMap<>();
    out.put("defaultProfile", ProfileRegistry.defaultId());
    out.put("profiles", ProfileRegistry.all());
    Map<String, String> banners = new LinkedHashMap<>();
    for (CalculationEngine e : engines) {
      EngineDescriptor d = e.descriptor();
      banners.put(d.family().toLowerCase(),
          "Calculation Method: " + d.family() + "\nProfile: " + d.id() + "\nStatus: " + d.status());
    }
    out.put("banners", banners);
    return out;
  }
}
