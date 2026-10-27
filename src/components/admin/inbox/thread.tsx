"use client";

import { AlertCircle, Check, CheckCheck, Clock, ImageIcon, MessageSquare, Mic, Video } from "lucide-react";
import { dayLabel, timeLabel } from "@/lib/datetime";
import type { InboxMessage } from "@/lib/inbox-types";

export function InboxThread({
  messages,
  dividerId,
  copy,
}: {
  messages: InboxMessage[];
  dividerId?: string | null;
  copy: {
    empty: string;
    photo: string;
    video: string;
    voice: string;
    file: string;
    read: string;
    unread: string;
    sent: string;
    sending: string;
    failed: string;
    newMessages: string;
  };
}) {
  if (messages.length === 0) {
    return (
      <div className="grid h-full place-items-center px-4 py-10 text-center">
        <div>
          <MessageSquare className="mx-auto size-7 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">{copy.empty}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {messages.map((message, index) => {
        const previous = messages[index - 1];
        const out = message.direction === "out";
        const showDay = !previous || dayLabel(previous.createdAt) !== dayLabel(message.createdAt);
        const grouped =
          previous &&
          previous.direction === message.direction &&
          new Date(message.createdAt).getTime() - new Date(previous.createdAt).getTime() < 3 * 60 * 1000;

        return (
          <div key={message.id}>
            {message.id === dividerId && (
              <div className="my-3 flex items-center gap-2">
                <span className="h-px flex-1 bg-border" />
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-800">
                  {copy.newMessages}
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>
            )}

            {showDay && (
              <p className="my-3 text-center text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                {dayLabel(message.createdAt)}
              </p>
            )}

            <div className={grouped ? "mt-1" : "mt-3"}>
              <div
                className={
                  out
                    ? "ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-brand-800 px-3 py-1.5 text-sm text-white sm:max-w-[70%]"
                    : "mr-auto w-fit max-w-[85%] rounded-2xl rounded-bl-sm bg-card px-3 py-1.5 text-sm text-foreground shadow-sm sm:max-w-[70%]"
                }
              >
                {message.mediaPath && message.mediaType === "video" && (
                  <video
                    src={message.mediaPath}
                    controls
                    playsInline
                    preload="metadata"
                    className="mt-1 max-h-72 w-full rounded-lg bg-black/20"
                  />
                )}

                {message.mediaPath && message.mediaType === "audio" && (
                  <audio
                    src={message.mediaPath}
                    controls
                    preload="metadata"
                    className="mt-1 w-60 max-w-full"
                  />
                )}

                {message.mediaPath && message.mediaType !== "video" && message.mediaType !== "audio" && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <a href={message.mediaPath} target="_blank" rel="noreferrer">
                    <img
                      src={message.mediaPath}
                      alt={copy.photo}
                      loading="lazy"
                      className="mt-1 max-h-72 w-full rounded-lg object-contain"
                    />
                  </a>
                )}

                {!message.mediaPath && message.mediaType === "video" && (
                  <span className="mt-1 flex items-center gap-1.5 text-xs opacity-80">
                    <Video className="size-3.5" />
                    {copy.video}
                  </span>
                )}

                {!message.mediaPath && message.mediaType === "audio" && (
                  <span className="mt-1 flex items-center gap-1.5 text-xs opacity-80">
                    <Mic className="size-3.5" />
                    {copy.voice}
                  </span>
                )}

                {!message.mediaPath && message.mediaType === "photo" && (
                  <span className="mt-1 flex items-center gap-1.5 text-xs opacity-80">
                    <ImageIcon className="size-3.5" />
                    {copy.photo}
                  </span>
                )}

                {message.text && (
                  <p className="break-words whitespace-pre-wrap">{message.text}</p>
                )}

                <p
                  className={
                    out
                      ? "mt-0.5 flex items-center justify-end gap-1 text-[10px] text-white/65"
                      : "mt-0.5 flex items-center justify-end gap-1 text-[10px] text-muted-foreground"
                  }
                >
                  {timeLabel(message.createdAt)}

                  {message.status === "sending" && (
                    <span className="flex items-center gap-0.5" title={copy.sending}>
                      <Clock className="size-3" />
                    </span>
                  )}

                  {message.status === "failed" && (
                    <span className="flex items-center gap-0.5 font-semibold text-red-200" title={copy.failed}>
                      <AlertCircle className="size-3" />
                    </span>
                  )}

                  {!message.status && out && message.readAt && (
                    <span className="flex items-center gap-0.5" title={copy.read}>
                      <CheckCheck className="size-3" />
                    </span>
                  )}

                  {!message.status && out && !message.readAt && (
                    <span className="flex items-center gap-0.5" title={copy.sent}>
                      <Check className="size-3" />
                    </span>
                  )}

                  {!out && message.readAt && (
                    <span className="flex items-center gap-0.5" title={copy.read}>
                      <CheckCheck className="size-3" />
                    </span>
                  )}

                  {!out && !message.readAt && (
                    <span
                      className="flex items-center gap-0.5 font-semibold text-brand-700"
                      title={copy.unread}
                    >
                      <span className="size-1.5 rounded-full bg-brand-700" />
                      {copy.unread}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
