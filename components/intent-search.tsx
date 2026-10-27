"use client";
import { useState } from "react";

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
        <form action="/home-valuation">
          <label htmlFor="seller-address">Your home’s address</label>
          <div className="row">
            <input
              id="seller-address"
              name="address"
              required
              maxLength={300}
              autoComplete="street-address"
              placeholder="Street address"
            />
            <button className="go">Begin</button>
          </div>
          <small>
            A real person prepares your valuation. No automated guesses.
          </small>
        </form>
      )}
    </div>
  );
}
