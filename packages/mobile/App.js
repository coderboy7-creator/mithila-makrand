/**
 * Mithila Makaranda — React Native (Expo) entry.
 * Shares the deterministic core (@mithila/core) with the web platform.
 */
import React, { useMemo, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View, Pressable, Switch } from "react-native";

// Same core that powers the web server — pure JS, zero deps.
import {
  createContext, calculatePanchang, calculateKundali, methodBanner,
  runGoldenSuite,
} from "../core/src/index.js";

export default function App() {
  const [makaranda, setMakaranda] = useState(true);
  const today = new Date().toISOString().slice(0, 10);

  const panchang = useMemo(() => {
    const ctx = createContext({ profileId: makaranda ? "makaranda-v1" : "drik-v1", date: today });
    return { ctx, p: calculatePanchang(ctx) };
  }, [makaranda, today]);

  const gate = useMemo(() => runGoldenSuite().gate, []);

  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={s.pad}>
        <Text style={s.title}>Mithila Makaranda</Text>
        <Text style={s.sub}>Vedic Astrology Platform · Mobile shell</Text>

        <View style={s.row}>
          <Text style={s.label}>{makaranda ? "Makaranda / Mithila" : "Drik / Modern"}</Text>
          <Switch value={makaranda} onValueChange={setMakaranda} />
        </View>

        <View style={s.card}>
          <Text style={s.banner}>{methodBanner(panchang.ctx)}</Text>
        </View>

        <View style={s.card}>
          <Text style={s.h2}>Today's Panchang — {panchang.p.date}</Text>
          <KV k="Vara" v={panchang.p.vara} />
          <KV k="Tithi" v={`${panchang.p.tithi.paksha} ${panchang.p.tithi.name} (ends ${panchang.p.tithi.endTimestamp.slice(11, 16)}, ${panchang.p.tithi.sourceDandaPal})`} />
          <KV k="Nakshatra" v={`${panchang.p.nakshatra.name} (ends ${panchang.p.nakshatra.endTimestamp.slice(11, 16)}, ${panchang.p.nakshatra.sourceDandaPal})`} />
          <KV k="Sunrise / Sunset" v={`${panchang.p.sunrise} / ${panchang.p.sunset}`} />
          <KV k="Rahu Kaal" v={`${panchang.p.rahuKaal.start}–${panchang.p.rahuKaal.end}`} />
        </View>

        <View style={s.card}>
          <Text style={s.h2}>Golden validation gate</Text>
          <Text style={s.small}>{gate.makaranda.status} · Drik tithi identity {gate.drikCrossCheck.tithiIdentityMatches} · tolerance ±{gate.toleranceSeconds}s</Text>
        </View>

        <Text style={s.small}>Full feature set (Kundali, Vargas, Dashas, Milan, Gochar, Muhurta, Varshaphal, Prashna, Reports, Consult CRM) uses the identical @mithila/core services — see packages/mobile/README.md.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function KV({ k, v }) {
  return (
    <View style={s.kv}>
      <Text style={s.k}>{k}</Text>
      <Text style={s.v}>{v}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0d0f17" },
  pad: { padding: 20, gap: 12 },
  title: { color: "#f0c866", fontSize: 26, fontWeight: "700" },
  sub: { color: "#9aa0b5", marginBottom: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { color: "#ece9df", fontSize: 16, fontWeight: "600" },
  card: { backgroundColor: "#161a29", borderColor: "#262c45", borderWidth: 1, borderRadius: 14, padding: 16, gap: 8 },
  banner: { color: "#9aa0b5", fontFamily: "monospace", fontSize: 11, lineHeight: 17 },
  h2: { color: "#ece9df", fontSize: 16, fontWeight: "700" },
  kv: { gap: 2 },
  k: { color: "#6b7188", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 },
  v: { color: "#ece9df", fontSize: 14 },
  small: { color: "#6b7188", fontSize: 12, lineHeight: 17 },
});
