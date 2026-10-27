"use client";
import { useState } from "react";
import { InquiryForm, type CaptureConfig } from "@/components/inquiry-form";
export function PropertyInquiry({
  id,
  config,
  address,
  assistantEnabled,
}: {
  id: string;
  config: CaptureConfig;
  address: string;
  assistantEnabled: boolean;
}) {
  const [kind, setKind] = useState("Showing request");
  return (
    <div id="inquiry" className="card">
      <div className="inline" style={{ marginBottom: 24 }}>
        <button
          type="button"
          className="btn ghost"
          aria-pressed={kind === "Showing request"}
          onClick={() => setKind("Showing request")}
        >
          Request a showing
        </button>
        <button
          type="button"
          className="btn ghost"
          aria-pressed={kind === "Property question"}
          onClick={() => setKind("Property question")}
        >
          Ask about this property
        </button>
        <button
          type="button"
          className="text-button"
          onClick={() => setKind("General")}
        >
          Contact the agent
        </button>
      </div>
      {assistantEnabled && (
        <button
          className="text-button"
          style={{ marginBottom: 20 }}
          type="button"
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent("eg-chat-open", {
                detail: { propertyId: id, address },
              }),
            )
          }
        >
          Ask the assistant about this property
        </button>
      )}
      <InquiryForm key={kind} kind={kind} propertyId={id} config={config} />
    </div>
  );
}
