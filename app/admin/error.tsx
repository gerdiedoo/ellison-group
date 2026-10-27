"use client";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <div>
      <h1>We couldn’t load your workspace.</h1>
      <p>
        Check your connection and try again. Your submitted records are not
        reset.
      </p>
      <button className="btn solid" onClick={reset}>
        Retry
      </button>
    </div>
  );
}
