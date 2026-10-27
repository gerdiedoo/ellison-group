import { describe, it, expect } from "vitest";
import { requestsHuman } from "../../lib/chat-handoff";
describe("provider-independent human handoff", () => {
  it.each([
    "Connect me with an agent",
    "I want a human",
    "Please transfer me to your team",
    "Agent please",
  ])("recognizes explicit request %s", (text) =>
    expect(requestsHuman(text)).toBe(true),
  );
  it.each([
    "What agent represents this property?",
    "Don't connect me with an agent",
    "Show me homes in Chenal",
  ])("does not mistake ordinary questions for handoff %s", (text) =>
    expect(requestsHuman(text)).toBe(false),
  );
});
