package app.mithila.makaranda.core.spi;

/** Immutable identity card of a calculation engine. Shown on every result banner. */
public record EngineDescriptor(
    String id,
    String family,          // MAKARANDA | DRIK | HYBRID
    String version,
    String ephemerisSource,
    String status) {        // e.g. CERTIFIED, UNVERIFIED, UNVERIFIED_HYBRID
}
