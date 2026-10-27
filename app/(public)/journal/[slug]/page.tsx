import { notFound } from "next/navigation";
import Link from "next/link";
const articles: Record<string, { title: string; body: string }> = {
  market: {
    title:
      "The Farmers Market closes for the season Oct. 31, then moves indoors",
    body: "A neighborhood is more than the home itself. When exploring Little Rock, set aside time to walk the riverfront and visit local businesses. Market hours and seasonal events can change; check with the organizer before planning your visit.",
  },
  character: {
    title:
      "Halloween at the Little Rock Zoo is two events, with an hour between them",
    body: "Little Rock’s local events are one way to get to know the city. Check the zoo’s official event information for current schedules, admission and any separate time slots before planning your evening. Our team can help you explore the neighborhoods around the places you enjoy.",
  },
  outdoors: {
    title:
      "The ribbon gets cut at Pinnacle, but Highway 10 trailheads opened first",
    body: "Access to outdoor space can shape how a home feels day to day. As you explore West Little Rock, consider the routes and recreation that matter to you. Check official park information for current trail access, hours and conditions.",
  },
};
export default async function Article({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!Object.hasOwn(articles, slug)) notFound();
  const a = articles[slug];
  return (
    <article className="wrap page legal-copy">
      <span className="eyebrow">Little Rock, noted</span>
      <h1>{a.title}</h1>
      <p className="notice">
        Confirm current event details and dates with the organizer before making
        travel plans.
      </p>
      <p>{a.body}</p>
      <Link className="btn solid" href="/contact">
        Explore the area with us →
      </Link>
    </article>
  );
}
