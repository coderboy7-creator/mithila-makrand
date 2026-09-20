package app.mithila.makaranda.core.profile;

import java.util.List;

/** Versioned calculation profile — stored with every result, never inferred from UI. */
public record ProfileDef(
    String id,
    String method,             // MAKARANDA | DRIK | HYBRID
    String version,
    String ayanamsaDefault,
    List<String> ayanamsaOptions,
    String panchang,
    String dayBoundary,        // SUNRISE (danda-pala end times relative to local sunrise)
    String status) {
}
