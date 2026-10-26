import Link from "next/link";
import { catalog, money } from "@/lib/data";
import { NeighborhoodExplorer } from "@/components/neighborhood-explorer";
import { AboutContent } from "@/components/about-content";
import { ClientStories } from "@/components/client-stories";
import { IntentSearch } from "@/components/intent-search";
export default async function Home() {
  const { properties, unconfigured } = await catalog();
  return (
    <>
      <div className="hero">
        <div
          className="hero-art"
          style={{
            backgroundImage: "url(/illustrations/hero.svg)",
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        />
        <div className="wrap hero-in">
          <div className="hero-grid">
            <div>
              <span className="eyebrow">
                Keller Williams Realty · Little Rock, Arkansas
              </span>
              <h1>
                <span className="l">
                  <span>A more</span>
                </span>
                <span className="l">
                  <span>
                    <em>considered</em>
                  </span>
                </span>
                <span className="l">
                  <span>way home.</span>
                </span>
              </h1>
              <p className="lede">
                Thirty-three years of Central Arkansas knowledge, applied one
                household at a time. Guidance that is local, personal and
                unhurried.
              </p>
              <div className="ctas">
                <Link className="btn light" href="/properties">
                  Explore homes →
                </Link>
                <Link className="btn brick" href="/home-valuation">
                  Sell with us →
                </Link>
              </div>
            </div>
            <IntentSearch />
          </div>
        </div>
      </div>
      <section id="homes">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="eyebrow">Selected homes</span>
              <h2>
                Spaces with <em>a story.</em>
              </h2>
            </div>
            <Link href="/properties" className="link">
              Explore all homes →
            </Link>
          </div>
          {properties.length ? (
            <div className="stack">
              {properties.slice(0, 3).map((p, i) => (
                <article className={"feature " + ["a", "b", "c"][i]} key={p.id}>
                  <Link className="ph" href={"/properties/" + p.slug}>
                    <img
                      className="art"
                      src={
                        p.images[0] ||
                        "/illustrations/" + p.illustration + ".svg"
                      }
                      alt={
                        p.images[0] ? p.address : "Conceptual home illustration"
                      }
                    />
                    <span className="tag">{p.listing_status}</span>
                    {!p.images[0] && (
                      <span className="note">Illustration only</span>
                    )}
                  </Link>
                  <div className="tx">
                    <span className="eyebrow">{p.neighborhood}</span>
                    <h3>{p.address}</h3>
                    <p>{p.location}</p>
                    <div className="spec">
                      <span>{p.beds} beds</span>
                      <span>{p.baths} baths</span>
                      <span>{p.sqft.toLocaleString()} sq ft</span>
                    </div>
                    <span className="price">{money(p.price)}</span>
                    <Link className="link" href={"/properties/" + p.slug}>
                      Explore this home →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="notice">
              {unconfigured
                ? "Current listings will appear once the property database is connected."
                : "New homes are being prepared for our selection."}{" "}
              <Link href="/contact" className="link">
                Ask us about homes →
              </Link>
            </p>
          )}
        </div>
      </section>
      <NeighborhoodExplorer />
      <AboutContent />
      <ClientStories />
      <section className="value">
        <div className="wrap vgrid">
          <div>
            <span className="eyebrow">For sellers</span>
            <h2>
              What is your home <em>really</em> worth?
            </h2>
            <p>
              Automated estimates are a starting point at best. Tell us about
              your home and Kerry’s team will prepare a considered valuation by
              hand.
            </p>
          </div>
          <div>
            <Link className="btn solid" href="/home-valuation">
              Request my valuation →
            </Link>
          </div>
        </div>
      </section>
      <section id="journal">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="eyebrow">Journal</span>
              <h2>
                Little Rock, <em>noted.</em>
              </h2>
            </div>
            <p>Local insight, season by season.</p>
          </div>
          <div className="jgrid">
            {[
              [
                "market",
                "Around town",
                "The Farmers Market closes for the season Oct. 31, then moves indoors",
              ],
              [
                "character",
                "At home",
                "Halloween at the Little Rock Zoo is two events, with an hour between them",
              ],
              [
                "outdoors",
                "Outdoors",
                "The ribbon gets cut at Pinnacle, but Highway 10 trailheads opened first",
              ],
            ].map(([slug, k, title]) => (
              <article className="post" key={slug}>
                <span className="k">{k}</span>
                <h4>{title}</h4>
                <Link className="link" href={"/journal/" + slug}>
                  Read →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
      <div className="news">
        <div className="wrap ngrid">
          <div>
            <span className="eyebrow">Monthly</span>
            <h2>
              The Market <em>Review</em>
            </h2>
            <p>Request Little Rock market updates from our team.</p>
          </div>
          <Link className="btn solid" href="/newsletter">
            Request updates →
          </Link>
        </div>
      </div>
      <div className="closing">
        <div className="wrap">
          <span className="eyebrow">Your journey starts here</span>
          <h2>
            Let’s find <em>your</em> place.
          </h2>
          <p>
            Market expertise, steady negotiation and a client-first approach.
          </p>
          <Link className="btn brick" href="/contact">
            Talk with us →
          </Link>
        </div>
      </div>
    </>
  );
}
