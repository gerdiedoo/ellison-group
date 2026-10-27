"use client";
import { useState } from "react";
const stories = [
  {
    r: "buying",
    q: "James Kirk was wonderful! I enjoyed working with him. He was patient, honest, and kind.",
    w: "Cindy U.",
    c: "Buying · worked with James Kirk",
  },
  {
    r: "selling",
    q: "They show up as true professionals with great ideas to help you get your home sold in less time, for more money, and less hassles.",
    w: "Dennis R.",
    c: "Selling",
  },
  {
    r: "buying",
    q: "The Kerry Ellison Team was more than helpful throughout the process of purchasing my home.",
    w: "Steve F.",
    c: "Buying",
  },
  {
    r: "selling",
    q: "Kerry and Angie are phenomenal to work with. They are always available to answer any questions.",
    w: "Sean U.",
    c: "Buying & selling",
  },
  {
    r: "buying",
    q: "We loved working with The Ellison Group. The whole team was so helpful and knowledgable.",
    w: "Geoffrey A.",
    c: "Buying",
  },
  {
    r: "selling",
    q: "My wife and I have a great relationship with Kerry and team and we are always confident they will provide value.",
    w: "Scott B.",
    c: "Repeat clients",
  },
  {
    r: "buying",
    q: "5 stars and would give more if I could. Highly recommend. Extremely knowledgeable and professional!",
    w: "Kevin A.",
    c: "Client",
  },
  {
    r: "selling",
    q: "The Ellison Group has consistently demonstrated an exceptional level of care and dedication to meeting all of our needs.",
    w: "Pam H.",
    c: "Client",
  },
  {
    r: "buying",
    q: "The Ellison Group provided my family with exceptional realtor service. They really went above and beyond.",
    w: "Matt N.",
    c: "Buying",
  },
];
export function ClientStories() {
  const [filter, setFilter] = useState("all"),
    [all, setAll] = useState(false);
  const items = stories.filter((s) => filter === "all" || s.r === filter);
  return (
    <section id="stories">
      <div className="wrap">
        <div className="sec-head">
          <div>
            <span className="eyebrow">Client stories</span>
            <h2>
              In their <em>own words</em>
            </h2>
          </div>
          <p>A few of many. Each is shown as written by the client.</p>
        </div>
        <div className="storytabs">
          {["all", "buying", "selling"].map((f) => (
            <button
              className="fbtn"
              key={f}
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="stories">
          {items.slice(0, all ? items.length : 3).map((s) => (
            <figure className="story" key={s.w}>
              <blockquote>{s.q}</blockquote>
              <figcaption>
                {s.w}
                <br />
                <small>{s.c}</small>
              </figcaption>
            </figure>
          ))}
        </div>
        <button
          className="link"
          style={{ marginTop: 30 }}
          onClick={() => setAll(!all)}
        >
          {all ? "Show fewer stories" : "Read more stories"} →
        </button>
      </div>
    </section>
  );
}
