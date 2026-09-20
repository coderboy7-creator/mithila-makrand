package app.mithila.makaranda.core.math;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

class JulianTest {
  @Test void j2000() { assertEquals(2451545.0, Julian.of(2000, 1, 1, 12, 0, 0), 1e-9); }

  @Test void goldenSheetEpoch() { assertEquals(2459789.5, Julian.of(2022, 7, 29, 0, 0, 0), 1e-9); }

  @Test void jdnFloor() { assertEquals(2459790L, Julian.jdn(2459789.5)); }
}
