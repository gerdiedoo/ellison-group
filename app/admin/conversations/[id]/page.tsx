import { ConversationInbox } from "@/components/admin/inbox-view";
export default async function Conversation({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <ConversationInbox
      selectedId={(await params).id}
      filters={await searchParams}
    />
  );
}
