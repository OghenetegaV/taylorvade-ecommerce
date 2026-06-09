// src/components/admin/OrderMap.tsx
// World map showing order locations — requires: npm install react-simple-maps
"use client";

import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { useMemo } from "react";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Map country names (from address table) to ISO-3166-1 numeric codes
const COUNTRY_CODES: Record<string, number> = {
  "Afghanistan":826, "Nigeria":566, "United Kingdom":826, "UK":826,
  "United States":840, "USA":840, "United States of America":840,
  "Ghana":288, "South Africa":710, "Kenya":404, "Ethiopia":231,
  "Canada":124, "Australia":36, "Germany":276, "France":250,
  "Netherlands":528, "Italy":380, "Spain":724, "Sweden":752,
  "Norway":578, "Denmark":208, "UAE":784, "Saudi Arabia":682,
  "India":356, "China":156, "Japan":392, "Brazil":76,
  "Mexico":484, "Argentina":32, "Egypt":818, "Morocco":504,
  "Tanzania":834, "Uganda":800, "Cameroon":120, "Senegal":686,
  "Ivory Coast":384, "Cote d'Ivoire":384, "Zimbabwe":716,
  "Zambia":894, "Angola":24, "Rwanda":646, "Mali":466,
};

type Props = {
  data: { country: string; count: number }[];
};

export default function OrderMap({ data }: Props) {
  const maxCount = Math.max(...data.map(d => d.count), 1);

  const countryMap = useMemo(() => {
    const map: Record<number, number> = {};
    data.forEach(d => {
      const code = COUNTRY_CODES[d.country];
      if (code) map[code] = d.count;
    });
    return map;
  }, [data]);

  function getColor(numericCode: number) {
    const count = countryMap[numericCode] ?? 0;
    if (count === 0) return "#f0eeeb";
    const intensity = Math.min(count / maxCount, 1);
    const dark = Math.round(26 + intensity * (26 - 26));
    const alpha = 0.15 + intensity * 0.85;
    return `rgba(26, 16, 8, ${alpha})`;
  }

  return (
    <div style={{ height: 320, width: "100%" }}>
      <ComposableMap
        projectionConfig={{ scale: 140, center: [20, 10] }}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map(geo => {
                const numCode = parseInt(geo.id);
                const count   = countryMap[numCode] ?? 0;
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={getColor(numCode)}
                    stroke="#e8e2db"
                    strokeWidth={0.5}
                    style={{
                      default:  { outline: "none" },
                      hover:    { outline: "none", fill: count > 0 ? "#3a2e22" : "#e8e2db", cursor: count > 0 ? "pointer" : "default" },
                      pressed:  { outline: "none" },
                    }}
                    title={count > 0 ? `${count} order${count !== 1 ? "s" : ""}` : undefined}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
      {data.length === 0 && (
        <p className="text-center text-[11px] text-[#8a7a6a] mt-4 -translate-y-12">
          No order location data yet
        </p>
      )}
    </div>
  );
}
