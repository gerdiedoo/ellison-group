"use client";
import { useState } from "react";
import Link from "next/link";
import { neighborhoods } from "@/lib/neighborhoods";
export function NeighborhoodExplorer({
  counts = {},
}: {
  counts?: Record<string, number>;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const n =
    selected === null
      ? {
          name: "Little Rock",
          description:
            "Six neighborhoods, one team that knows them. Select one on the map to see what makes it different.",
          features: [],
        }
      : neighborhoods[selected];
  return (
    <section className="explore" id="neighborhoods">
      <div className="wrap">
        <div className="sec-head">
          <div>
            <span className="eyebrow">A local’s perspective</span>
            <h2>
              Six neighborhoods.
              <br />
              <em>One place to belong.</em>
            </h2>
          </div>
          <p>
            Six neighborhoods, one team that knows them. Select one on the map
            to see what makes it different.
          </p>
        </div>
        <div className="xgrid">
          <div className="mapbox">
            <svg
              viewBox="0 0 700 480"
              role="group"
              aria-label="Illustrative neighborhood map"
            >
              <defs>
                <pattern
                  id="gr"
                  width="40"
                  height="40"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M40 0H0V40"
                    fill="none"
                    stroke="#fff"
                    strokeOpacity=".05"
                  />
                </pattern>
              </defs>
              <rect width="700" height="480" fill="url(#gr)" />
              <path
                d="M0 205 C120 190 170 230 260 215 C350 200 380 170 470 200 C560 232 620 210 700 190"
                fill="none"
                stroke="#5c8ea0"
                strokeWidth="22"
                strokeOpacity=".5"
                strokeLinecap="round"
              />
              <text
                x="500"
                y="168"
                fill="#8fc0cf"
                fontSize="11"
                letterSpacing="3"
              >
                ARKANSAS RIVER
              </text>
              {neighborhoods.map((a, i) => (
                <g
                  key={a.name}
                  className={"hot " + (selected === i ? "on" : "")}
                  tabIndex={0}
                  role="button"
                  aria-label={a.name}
                  aria-pressed={selected === i}
                  onClick={() => setSelected(i)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelected(i);
                    }
                  }}
                >
                  <circle className="halo" cx={a.x} cy={a.y} r={45} />
                  <circle className="dot" cx={a.x} cy={a.y} r={9} />
                  <text x={a.x + 16} y={a.y + 4}>
                    {a.name}
                  </text>
                </g>
              ))}
            </svg>
            <div className="maplegend">Illustrative map, not to scale</div>
          </div>
          <div className="panel">
            <span className="eyebrow">Neighborhood</span>
            <h3>{n.name}</h3>
            <p>{n.description}</p>
            <p aria-live="polite">
              {selected === null
                ? Object.values(counts).reduce((a, b) => a + b, 0)
                : counts[n.name] || 0}{" "}
              published homes in our current selection
            </p>
            <div className="chips">
              {n.features.map((f) => (
                <span className="chip" key={f}>
                  {f}
                </span>
              ))}
            </div>
            <Link
              className="btn light"
              href={
                selected === null
                  ? "/properties"
                  : "/properties?area=" + encodeURIComponent(n.name)
              }
            >
              Explore homes here →
            </Link>
            <button
              className="text-button"
              style={{ marginTop: 16 }}
              onClick={() => setSelected(null)}
            >
              Reset selection
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
