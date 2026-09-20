package app.mithila.makaranda.core.profile;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Versioned profiles. Mirrors packages/core/src/profiles.js until parity tests
 * take over as the bridge.
 */
public final class ProfileRegistry {
  private static final Map<String, ProfileDef> PROFILES = new LinkedHashMap<>();

  static {
    PROFILES.put("makaranda-v1", new ProfileDef(
        "makaranda-v1", "MAKARANDA", "v1",
        "MAKARANDA_ANCHOR", List.of("MAKARANDA_ANCHOR"),
        "MITHILA_VISHWAVIDYALAYA", "SUNRISE", "UNVERIFIED"));
    PROFILES.put("drik-v1", new ProfileDef(
        "drik-v1", "DRIK", "v1",
        "LAHIRI_CITRA",
        List.of("LAHIRI_CITRA", "LAHIRI", "RAMAN", "KRISHNAMURTI", "YUKTESHWAR", "FAGAN_BRADLEY"),
        "DRIK", "SUNRISE", "CERTIFIED"));
    PROFILES.put("makaranda-v2-hybrid", new ProfileDef(
        "makaranda-v2-hybrid", "HYBRID", "v2",
        "MAKARANDA_ANCHOR", List.of("MAKARANDA_ANCHOR"),
        "MITHILA_VISHWAVIDYALAYA", "SUNRISE", "UNVERIFIED_HYBRID"));
  }

  private ProfileRegistry() {}

  public static String defaultId() { return "makaranda-v1"; }

  public static Map<String, ProfileDef> all() { return Map.copyOf(PROFILES); }

  public static ProfileDef get(String id) {
    ProfileDef p = PROFILES.get(id);
    if (p == null) throw new IllegalArgumentException("unknown calculation profile: " + id);
    return p;
  }
}
