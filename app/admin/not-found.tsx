import Link from "next/link";
export default function MissingRecord() {
  return (
    <div>
      <h1>Record unavailable.</h1>
      <p>This record could not be found.</p>
      <Link className="btn" href="/admin">
        Return to overview
      </Link>
    </div>
  );
}
