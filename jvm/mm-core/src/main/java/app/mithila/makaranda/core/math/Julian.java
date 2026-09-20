package app.mithila.makaranda.core.math;

/** Julian Day arithmetic (UTC input). Fliegel–Van Flandern, Gregorian only. */
public final class Julian {
  private Julian() {}

  /** JD for a UTC civil date/time. */
  public static double of(int year, int month, int day, int hour, int minute, double second) {
    int a = (14 - month) / 12;
    int y = year + 4800 - a;
    int m = month + 12 * a - 3;
    long jdn = day + (153L * m + 2) / 5 + 365L * y + y / 4 - y / 100 + y / 400 - 32045;
    return jdn + (hour - 12) / 24.0 + minute / 1440.0 + second / 86400.0;
  }

  /** Whole-day JDN floor (astronomical day starts at 12:00 UT). */
  public static long jdn(double jd) { return (long) Math.floor(jd + 0.5); }
}
