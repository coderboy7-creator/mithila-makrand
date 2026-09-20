# IAU-1980 nutation parsed from the generated JS tables (single source of truth)
import re, math, os
_HERE = os.path.dirname(os.path.abspath(__file__))
def load_tables(path=os.path.join(_HERE, "..", "packages", "core", "src", "meeusTables.js")):
    src = open(path).read()
    def rows(name):
        m = re.search(name + r" = \[(.*?)\];", src, re.S)
        return [[float(x) for x in r.split(",")] for r in re.findall(r"\[([-\d.eE,]+)\]", m.group(1))]
    return rows("NUTATION_IAU1980_PSI"), rows("NUTATION_IAU1980_EPS")
_PSI, _EPS = load_tables()
def nutation_deg(jdTT):
    J2000 = 2451545.0
    T = (jdTT - J2000)/36525
    D  = (297.85036 + 445267.111480*T - 0.0019142*T*T + T**3/189474) % 360
    M  = (357.52772 + 35999.050340*T - 0.0001603*T*T - T**3/300000) % 360
    Mp = (134.96298 + 477198.867398*T + 0.0086972*T*T + T**3/56250) % 360
    F  = (93.27191 + 483202.017538*T - 0.0036825*T*T + T**3/327270) % 360
    Om = (125.04452 - 1934.136261*T + 0.0020708*T*T + T**3/450000) % 360
    dp = de = 0.0
    for d,m,mp,f,om,a,b in _PSI:
        dp += (a + b*T)*math.sin(math.radians(d*D+m*M+mp*Mp+f*F+om*Om))
    for d,m,mp,f,om,a,b in _EPS:
        de += (a + b*T)*math.cos(math.radians(d*D+m*M+mp*Mp+f*F+om*Om))
    return dp/36000000, de/36000000  # degrees
