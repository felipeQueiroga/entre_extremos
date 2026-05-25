import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@entre-extremos/shared";
import { useGame } from "../hooks/GameContext";

export default function RoomChat() {
  const { messages, sendChat } = useGame();
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendChat(trimmed);
    setText("");
  }

  return (
    <div className="flex h-full min-h-[200px] flex-col rounded-2xl border border-slate-700 bg-slate-900/80">
      <div className="border-b border-slate-700 px-4 py-2 font-semibold text-slate-300">Chat</div>
      <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto px-3 py-2">
        {messages.length === 0 && (
          <p className="text-center text-sm text-slate-500">Nenhuma mensagem ainda.</p>
        )}
        {messages.map((m: ChatMessage) => (
          <div key={m.id} className="rounded-lg bg-slate-800/80 px-3 py-2 text-sm">
            <span className="font-medium text-indigo-300">{m.playerName}</span>
            <span className="ml-2 text-slate-400">{m.text}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2 border-t border-slate-700 p-2">
        <input
          type="text"
          maxLength={200}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Mensagem..."
          className="flex-1 rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold hover:bg-indigo-500 disabled:opacity-40"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
