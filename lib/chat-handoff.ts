// Explicit human requests must work even when the model provider is unavailable.
export function requestsHuman(text: string) {
  const value = text.toLowerCase().replaceAll("’", "'");
  if (
    /\b(?:do not|don't|not ready to)\s+(?:connect|transfer|talk|speak)/.test(
      value,
    )
  )
    return false;
  return (
    /\b(?:talk|speak|connect|transfer|chat)\s+(?:me\s+)?(?:to|with)\s+(?:(?:a|an|the|your)\s+)?(?:human|agent|person|team)\b/.test(
      value,
    ) ||
    /\b(?:want|need|like)\s+(?:a|an)\s+(?:human|agent|person)\b/.test(value) ||
    /\b(?:human|agent)\s+please\b/.test(value)
  );
}
