"use client";
import { useEffect, useRef, type ReactNode } from "react";
export function InboxTranscript({
  children,
  lastMessageId,
}: {
  children: ReactNode;
  lastMessageId?: string;
}) {
  const transcript = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (transcript.current)
      transcript.current.scrollTop = transcript.current.scrollHeight;
  }, [lastMessageId]);
  return (
    <div
      ref={transcript}
      className="tr-box"
      role="log"
      aria-label="Conversation transcript"
    >
      {children}
    </div>
  );
}
