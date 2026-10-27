import Link from "next/link";
export default function NotFound() {
  return (
    <main className="wrap page">
      <h1>A different way home.</h1>
      <p>This page or property is unavailable.</p>
      <Link className="btn solid" href="/properties">
        Explore homes
      </Link>
    </main>
  );
}
