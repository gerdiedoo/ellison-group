"use client";
import { useState } from "react";
import Link from "next/link";
export function IntentSearch() {
  const [mode, setMode] = useState("buy");
  return (
    <div className="intent">
      <div className="seg" role="tablist" aria-label="I want to">
        <button
          role="tab"
          aria-selected={mode === "buy"}
          onClick={() => setMode("buy")}
        >
          I’m buying
        </button>
        <button
          role="tab"
          aria-selected={mode === "sell"}
          onClick={() => setMode("sell")}
        >
          I’m selling
        </button>
      </div>
      {mode === "buy" ? (
        <form action="/properties">
          <label htmlFor="hero-area">Where in Little Rock?</label>
          <div className="row">
            <select name="area" id="hero-area">
              <option value="">Anywhere we work</option>
              {[
                "Chenal",
                "Pleasant Valley",
                "Historic Downtown",
                "Beyond Little Rock",
              ].map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
            <button className="go">Show homes</button>
          </div>
          <small>Or wander the map to find your fit.</small>
        </form>
      ) : (
        <>
          <p>A real person prepares your valuation. No automated guesses.</p>
          <Link href="/home-valuation" className="btn light">
            Begin your valuation →
          </Link>
        </>
      )}
    </div>
  );
}
