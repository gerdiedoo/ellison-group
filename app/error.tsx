"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="wrap page">
      <h1>We couldn’t load this page.</h1>
      <p>
        Please try again. If this continues, contact our team at (501) 725-1227.
      </p>
      <button className="btn solid" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
