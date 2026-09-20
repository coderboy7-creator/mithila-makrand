package app.mithila.makaranda.core.math;

/** Degree helpers shared by all engines (engines never share code with each other). */
public final class Angle {
  private Angle() {}

  public static double norm360(double deg) {
    double r = deg % 360.0;
    return r < 0 ? r + 360.0 : r;
  }

  /** [deg, min, sec] with sec rounded; min carried. */
  public static int[] dms(double deg) {
    double d = norm360(deg);
    int dd = (int) d;
    double mf = (d - dd) * 60;
    int mm = (int) mf;
    int ss = (int) Math.round((mf - mm) * 60);
    if (ss == 60) { ss = 0; mm++; }
    if (mm == 60) { mm = 0; dd = (dd + 1) % 360; }
    return new int[] { dd, mm, ss };
  }

  public static String dmsString(double deg) {
    int[] v = dms(deg);
    return v[0] + "°" + String.format("%02d", v[1]) + "′" + String.format("%02d", v[2]) + "″";
  }
}
