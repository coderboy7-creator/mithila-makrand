package app.mithila.makaranda.api;

import app.mithila.makaranda.core.spi.CalculationEngine;
import app.mithila.makaranda.engine.drik.DrikEngine;
import app.mithila.makaranda.engine.makaranda.MakarandaEngine;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Composition root: the ONLY place both engines are referenced together. */
@Configuration
public class EngineConfig {
  @Bean CalculationEngine drikEngine() { return new DrikEngine(); }

  @Bean CalculationEngine makarandaEngine() { return new MakarandaEngine(); }
}
