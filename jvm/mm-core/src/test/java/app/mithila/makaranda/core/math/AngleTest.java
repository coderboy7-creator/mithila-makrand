package app.mithila.makaranda.core.math;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;

class AngleTest {
  @Test void norm() { assertEquals(350.0, Angle.norm360(-10), 1e-12); assertEquals(10.0, Angle.norm360(370), 1e-12); }

  @Test void dmsCarry() { assertArrayEquals(new int[] {24, 13, 0}, Angle.dms(24 + 12.0 / 60 + 59.99 / 3600)); }

  @Test void rahuSpot() { assertEquals("24°12′55″", Angle.dmsString(24 + 12.0 / 60 + 54.8 / 3600)); }
}
