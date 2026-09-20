package app.mithila.makaranda.core.spi;

/**
 * Strategy boundary every engine implements. Engines live in separate Maven
 * modules and MUST NOT import each other; mm-api composes them.
 */
public interface CalculationEngine {
  EngineDescriptor descriptor();
}
