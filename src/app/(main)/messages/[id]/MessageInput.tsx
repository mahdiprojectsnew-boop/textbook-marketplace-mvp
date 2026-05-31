"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2 } from "lucide-react";

export function MessageInput({ conversationId }: { conversationId: string }) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setError("");
    setSending(true);

    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to send."); return; }

      setBody("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as any);
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setBody(e.target.value);
    // Auto-grow textarea
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  }

  return (
    <form onSubmit={handleSend}>
      {error && (
        <p className="text-xs text-red-500 mb-2">{error}</p>
      )}
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={body}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send)"
          rows={1}
          className="flex-1 resize-none px-4 py-2.5 rounded-xl border border-[#d1d5db] bg-[#f8fafc] text-sm text-[#111827] placeholder:text-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent transition"
          style={{ maxHeight: "120px" }}
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !body.trim()}
          className="w-10 h-10 shrink-0 rounded-xl bg-[#1d4ed8] hover:bg-[#1e40af] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center text-white"
        >
          {sending
            ? <Loader2 size={15} className="animate-spin" />
            : <Send size={15} />
          }
        </button>
      </div>
    </form>
  );
}
