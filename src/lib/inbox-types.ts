export type InboxKind = "telegram" | "meta";

export type InboxChatItem = {
  key: string;
  id: string;
  kind: InboxKind;
  title: string;
  subtitle: string;
  time: string;
  ts: number;
  unread: number;
  lastText: string;
  lastOut: boolean;
  platform: string;
  avatar: string | null;
};

export type InboxMessage = {
  id: string;
  direction: string;
  text: string;
  author: string;
  createdAt: string;
  mediaType: string | null;
  mediaPath: string | null;
  readAt: string | null;
  status?: "sending" | "failed";
};

export type InboxThreadData = {
  kind: InboxKind;
  platform: "telegram" | "facebook" | "instagram" | "threads";
  id: string;
  title: string;
  subtitle: string;
  avatar: string | null;
  handle: string | null;
  externalId: string;
  business: boolean;
  messages: InboxMessage[];
};
