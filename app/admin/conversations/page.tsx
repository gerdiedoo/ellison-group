import { ConversationInbox } from "@/components/admin/inbox-view";
export default async function Inbox({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <ConversationInbox filters={await searchParams} />;
}
