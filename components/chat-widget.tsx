"use client";
import { useEffect, useState, useRef } from "react";
import { MessageCircle, X } from "lucide-react";
import { InquiryForm, type CaptureConfig } from "@/components/inquiry-form";
type Chat = {
  id: string;
  status: string;
  property_id?: string | null;
  messages: { id: string; sender: string; body: string; created_at: string }[];
};
export function ChatWidget({
  welcome,
  handoffEnabled,
  capture,
  enabled = true,
}: {
  welcome: string;
  handoffEnabled: boolean;
  capture: CaptureConfig;
  enabled?: boolean;
}) {
  const [open, setOpen] = useState(false),
    [chat, setChat] = useState<Chat | null>(null),
    [text, setText] = useState(""),
    [propertyContext, setPropertyContext] = useState<{
      propertyId: string;
      address: string;
    } | null>(null),
    [pending, setPending] = useState(false),
    [error, setError] = useState(""),
    [contact, setContact] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onProperty = (event: Event) => {
      const detail = (
        event as CustomEvent<{ propertyId: string; address: string }>
      ).detail;
      setPropertyContext(detail);
      setText("Tell me about " + detail.address + ".");
      setOpen(true);
    };
    window.addEventListener("eg-chat-open", onProperty);
    return () => window.removeEventListener("eg-chat-open", onProperty);
  }, []);
  useEffect(() => {
    // Existing human conversations remain accessible when automated chat is disabled.
    if (!open && enabled) return;
    const id = localStorage.getItem("eg_conversation_id");
    if (!id) return;
    let active = true;
    async function poll() {
      try {
        const res = await fetch("/api/chat?id=" + encodeURIComponent(id!), {
          cache: "no-store",
        });
        if (res.status === 404) {
          clearInterval(t);
          localStorage.removeItem("eg_conversation_id");
          if (active) setChat(null);
          return;
        }
        if (!res.ok) throw new Error("Unable to refresh conversation.");
        const data = await res.json();
        if (active) {
          setChat(data);
          setError("");
        }
      } catch {
        if (active) setError("Conversation refresh failed. Please try again.");
      }
    }
    const t = setInterval(poll, 5000);
    void poll();
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [open, chat?.id, enabled]);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [chat?.messages.length]);
  async function send(action: "message" | "handoff" | "start", body?: string) {
    setPending(true);
    setError("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          id: chat?.id,
          body,
          propertyId:
            action === "start" ? propertyContext?.propertyId : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to send message.");
      setChat(data);
      localStorage.setItem("eg_conversation_id", data.id);
      if (action === "message") setText("");
      if (action === "handoff") setContact(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to send message.");
    } finally {
      setPending(false);
    }
  }
  if (!enabled && !chat) return null;
  return (
    <>
      <button
        className="chat-launch inline"
        aria-label="Your real estate assistant"
        aria-expanded={open}
        aria-controls="chat-panel"
        onClick={() => setOpen(!open)}
      >
        <MessageCircle size={20} />
        <span className="chat-label">Your real estate assistant</span>
      </button>
      {open && (
        <aside
          id="chat-panel"
          className="chat-panel"
          aria-label="Real estate assistant"
        >
          <div className="chat-head">
            <strong>The Ellison Group</strong>
            <button onClick={() => setOpen(false)} aria-label="Close chat">
              <X />
            </button>
          </div>
          {contact && chat ? (
            <div className="chat-contact">
              <button className="text-button" onClick={() => setContact(false)}>
                ← Conversation
              </button>
              <InquiryForm
                kind="Chatbot handoff"
                conversationId={chat.id}
                propertyId={chat.property_id || undefined}
                config={capture}
                onSuccess={() => {
                  setContact(false);
                  setChat((previous) =>
                    previous ? { ...previous, status: "human" } : previous,
                  );
                }}
              />
            </div>
          ) : (
            <>
              <div className="messages" role="log" aria-live="polite">
                {propertyContext && (
                  <p className="notice">Looking at {propertyContext.address}</p>
                )}
                {!chat ? (
                  <>
                    <p>{welcome}</p>
                    <p className="policy">
                      Messages are stored and may be processed by Google Gemini.
                      Avoid sharing sensitive information.
                    </p>
                    <button
                      className="btn solid"
                      disabled={pending}
                      onClick={() => send("start")}
                    >
                      Start conversation
                    </button>
                  </>
                ) : (
                  <>
                    {chat.messages.map((m) => (
                      <div className={"message " + m.sender} key={m.id}>
                        <small>
                          {m.sender === "assistant"
                            ? "Assistant"
                            : m.sender === "agent"
                              ? "Our team"
                              : m.sender === "visitor"
                                ? "You"
                                : "System"}
                        </small>
                        <p>
                          {m.body
                            .split(
                              /(\/properties\/[a-z0-9-]+|\/home-valuation)/g,
                            )
                            .map((part, i) =>
                              part.startsWith("/properties/") ||
                              part === "/home-valuation" ? (
                                <a key={i} href={part} className="text-button">
                                  {part}
                                </a>
                              ) : (
                                part
                              ),
                            )}
                        </p>
                      </div>
                    ))}
                    {chat.status === "human" && (
                      <p className="notice">
                        You’re in the human assistance queue. Automated replies
                        are paused. Staff replies will appear here; response
                        times vary.
                      </p>
                    )}
                    {chat.status === "resolved" && (
                      <p className="notice">This conversation is resolved.</p>
                    )}
                    <div ref={bottom} />
                  </>
                )}
              </div>
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              {chat && (
                <>
                  <div className="inline" style={{ padding: "0 12px" }}>
                    {handoffEnabled && chat.status === "bot" && (
                      <button
                        className="text-button"
                        disabled={pending}
                        onClick={() =>
                          send(
                            "handoff",
                            "I would like to talk to a human agent.",
                          )
                        }
                      >
                        Talk to an agent
                      </button>
                    )}
                    {chat.status === "human" && (
                      <button
                        className="text-button"
                        onClick={() => setContact(true)}
                      >
                        Share contact details
                      </button>
                    )}
                    {chat.status === "resolved" && enabled && (
                      <button
                        className="text-button"
                        disabled={pending}
                        onClick={() => send("start")}
                      >
                        Start a new conversation
                      </button>
                    )}
                  </div>
                  {!enabled && chat.status === "bot" && (
                    <p className="notice">
                      The AI assistant is paused. Request human assistance or
                      contact our team.
                    </p>
                  )}
                  {chat.status !== "resolved" &&
                    (enabled || chat.status === "human") && (
                      <form
                        className="chat-form"
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (text.trim()) void send("message", text);
                        }}
                      >
                        <input
                          aria-label="Your message"
                          maxLength={2000}
                          value={text}
                          onChange={(e) => setText(e.target.value)}
                          required
                          disabled={pending}
                        />
                        <button disabled={pending || !text.trim()}>
                          {pending ? "Sending…" : "Send"}
                        </button>
                      </form>
                    )}
                </>
              )}
            </>
          )}
        </aside>
      )}
    </>
  );
}
