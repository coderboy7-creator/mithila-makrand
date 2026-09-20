package app.mithila.makaranda.engine.makaranda;

import app.mithila.makaranda.core.spi.CalculationEngine;
import app.mithila.makaranda.core.spi.EngineDescriptor;

/**
 * MAKARANDA engine boundary (Makarandaanushar / Mithila Vishwavidyalaya
 * Panchang methodology — the DEFAULT method). P3 ports the SS pipeline,
 * calibrated anchor and danda-pala strategies here.
 */
public class MakarandaEngine implements CalculationEngine {
  @Override
  public EngineDescriptor descriptor() {
    return new EngineDescriptor(
        "makaranda-v1",
        "MAKARANDA",
        "makaranda-v1",
        "Surya Siddhanta / Makaranda lineage, calibrated anchor; akshansh 26°35'N, deshantar 01|35 (verbatim, UNVERIFIED), palbha 06",
        "UNVERIFIED (golden gate diagnostic, no offset hacks)");
  }
}
