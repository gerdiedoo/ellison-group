"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { toggleFavorite } from "@/app/actions/favorites";
export function SaveButton({
  id,
  initial = false,
}: {
  id: string;
  initial?: boolean;
}) {
  const [saved, setSaved] = useState(initial),
    [error, setError] = useState(""),
    [pending, start] = useTransition();
  return (
    <div>
      <button
        className="btn ghost"
        disabled={pending}
        aria-pressed={saved}
        onClick={() =>
          start(async () => {
            try {
              const r = await toggleFavorite(id);
              if (r.error) setError(r.error);
              else {
                setSaved(!!r.saved);
                setError("");
              }
            } catch {
              setError("Unable to save. Please try again.");
            }
          })
        }
      >
        <Heart size={18} fill={saved ? "currentColor" : "none"} />
        {saved ? "Saved" : "Save property"}
      </button>
      {error && (
        <p role="status">
          {error}{" "}
          <Link className="text-button" href="/login?next=/favorites">
            Sign in
          </Link>
        </p>
      )}
    </div>
  );
}
