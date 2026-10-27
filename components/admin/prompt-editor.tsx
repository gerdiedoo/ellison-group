"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { defaultSuggestedPrompts } from "@/lib/chat-prompts";

export function PromptEditor({ prompts }: { prompts: string[] }) {
  const [rows, setRows] = useState(
    prompts.map((text, id) => ({ id, text })),
  );
  const nextId = useRef(prompts.length);
  return (
    <div className="prompts">
      <div className="prompt-label">Suggested prompts</div>
      {rows.map((row, index) => (
        <div className="pr" key={row.id}>
          <input
            name="prompts"
            aria-label={`Prompt ${index + 1}`}
            value={row.text}
            maxLength={200}
            required
            onChange={(event) =>
              setRows((old) =>
                old.map((item) =>
                  item.id === row.id
                    ? { ...item, text: event.target.value }
                    : item,
                ),
              )
            }
          />
          <button
            className="btn sm ghost"
            type="button"
            aria-label={`Remove prompt ${index + 1}`}
            onClick={() =>
              setRows((old) => old.filter((item) => item.id !== row.id))
            }
          >
            Remove
          </button>
        </div>
      ))}
      <div className="pill-row">
        <button
          className="btn sm"
          type="button"
          disabled={rows.length >= 12}
          onClick={() => {
            const id = nextId.current++;
            setRows((old) => [...old, { id, text: "New suggested prompt" }]);
          }}
        >
          <Plus size={16} /> Add prompt
        </button>
        <button
          className="btn sm ghost"
          type="button"
          onClick={() =>
            setRows(
              defaultSuggestedPrompts.map((text) => ({
                id: nextId.current++,
                text,
              })),
            )
          }
        >
          Restore default prompts
        </button>
      </div>
    </div>
  );
}
