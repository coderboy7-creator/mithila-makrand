package app.mithila.makaranda.core.profile;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ProfileRegistryTest {
  @Test void defaultIsMakaranda() { assertEquals("makaranda-v1", ProfileRegistry.defaultId()); }

  @Test void threeProfiles() { assertEquals(3, ProfileRegistry.all().size()); }

  @Test void drikDefaultAyanamsaIsChitraDefinition() {
    assertEquals("LAHIRI_CITRA", ProfileRegistry.get("drik-v1").ayanamsaDefault());
    assertEquals(6, ProfileRegistry.get("drik-v1").ayanamsaOptions().size());
  }

  @Test void unknownProfileThrows() { assertThrows(IllegalArgumentException.class, () -> ProfileRegistry.get("nope")); }
}
