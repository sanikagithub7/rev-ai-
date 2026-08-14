"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Send, Bot, User, RefreshCw, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface MessageRecord {
  id: string;
  conversation_id: string;
  sender: "lead" | "agent" | "user";
  text: string;
  timestamp: string;
  created_at: string;
}

interface ConversationRecord {
  id: string;
  organization_id: string;
  lead_name: string;
  lead_company: string;
  channel: string;
  last_message: string;
  messages?: MessageRecord[];
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeMessages, setActiveMessages] = useState<MessageRecord[]>([]);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const supabase = createClient();

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from("conversations")
        .select("*")
        .order("updated_at", { ascending: false });

      if (fetchErr) {
        setError(fetchErr.message);
        setConversations([]);
      } else {
        setConversations(data || []);
        if (data && data.length > 0 && !activeId) {
          setActiveId(data[0].id);
        }
      }
    } catch {
      setError("Failed to fetch conversations.");
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [supabase, activeId]);

  const fetchMessages = useCallback(async (convId: string) => {
    try {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true });

      setActiveMessages(data || []);
    } catch {
      setActiveMessages([]);
    }
  }, [supabase]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (activeId) {
      fetchMessages(activeId);
    }
  }, [activeId, fetchMessages]);

  const activeConv = conversations.find((c) => c.id === activeId);

  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim() || !activeId) return;

    setSending(true);
    const textToSend = replyText.trim();
    const timestampStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    try {
      const { data: member } = await supabase
        .from("organization_members")
        .select("organization_id")
        .limit(1)
        .single();

      if (!member) {
        setError("No active workspace found.");
        setSending(false);
        return;
      }

      const { data: newMsg, error: msgErr } = await supabase
        .from("messages")
        .insert({
          organization_id: member.organization_id,
          conversation_id: activeId,
          sender: "user",
          text: textToSend,
          timestamp: timestampStr,
        })
        .select()
        .single();

      if (msgErr) {
        setError(msgErr.message);
      } else if (newMsg) {
        setActiveMessages((prev) => [...prev, newMsg]);
        setReplyText("");

        // Update last_message in conversation
        await supabase
          .from("conversations")
          .update({ last_message: textToSend, updated_at: new Date().toISOString() })
          .eq("id", activeId);

        setConversations((prev) =>
          prev.map((c) => (c.id === activeId ? { ...c, last_message: textToSend } : c))
        );
      }
    } catch {
      setError("Failed to send message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-black pb-4">
        <div>
          <div className="text-xs font-mono text-[#123B2D] uppercase tracking-widest mb-1">
            // INBOUND COMMUNICATION INBOX
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight">
            CONVERSATIONS & MESSAGING
          </h1>
        </div>

        <button
          onClick={fetchConversations}
          className="px-3 py-2 border border-black bg-white hover:bg-neutral-100 text-xs font-bold uppercase sharp-border cursor-pointer flex items-center gap-1"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-600 text-xs font-bold uppercase text-red-900 flex items-center gap-2 sharp-border">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white p-12 text-center text-xs font-mono text-neutral-500 sharp-border flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-[#12B76A]" /> Fetching real conversations...
        </div>
      ) : conversations.length === 0 ? (
        <div className="bg-white p-12 text-center sharp-border space-y-4 max-w-xl mx-auto my-8">
          <div className="w-12 h-12 bg-black text-white sharp-border flex items-center justify-center mx-auto">
            <MessageSquare className="w-6 h-6 text-[#12B76A]" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-black">
            NO CONVERSATIONS YET
          </h2>
          <p className="text-xs text-neutral-600 max-w-md mx-auto leading-relaxed">
            Inbound prospective conversations from email webhooks and contact forms will appear here. No demo records displayed.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-[600px]">
          {/* Left Conversation List */}
          <div className="lg:col-span-4 bg-white sharp-border h-full flex flex-col overflow-hidden">
            <div className="p-3 bg-[#F1F2F3] border-b border-black text-xs font-mono font-bold uppercase tracking-wider">
              // ACTIVE THREADS ({conversations.length})
            </div>

            <div className="divide-y divide-neutral-200 overflow-y-auto flex-1">
              {conversations.map((c) => {
                const isSelected = c.id === activeId;
                return (
                  <div
                    key={c.id}
                    onClick={() => setActiveId(c.id)}
                    className={`p-4 cursor-pointer transition-colors ${
                      isSelected ? "bg-black text-white" : "hover:bg-[#F1F2F3] text-black"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs uppercase">{c.lead_name}</span>
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 sharp-border ${
                          isSelected
                            ? "bg-[#12B76A] text-white"
                            : "bg-[#F1F2F3] text-black border-black"
                        }`}
                      >
                        {c.channel}
                      </span>
                    </div>
                    <div className={`text-[10px] font-mono ${isSelected ? "text-neutral-300" : "text-neutral-500"}`}>
                      {c.lead_company}
                    </div>
                    <p className={`text-xs mt-2 line-clamp-1 ${isSelected ? "text-neutral-200" : "text-neutral-600"}`}>
                      {c.last_message || "No messages yet"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Active Message Thread */}
          {activeConv ? (
            <div className="lg:col-span-8 bg-white sharp-border h-full flex flex-col justify-between overflow-hidden">
              {/* Thread Header */}
              <div className="p-4 bg-[#F1F2F3] border-b border-black flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-sm uppercase text-black">
                    {activeConv.lead_name} &bull; {activeConv.lead_company}
                  </div>
                  <div className="text-[10px] font-mono text-neutral-500 uppercase">
                    CHANNEL: {activeConv.channel} &bull; RLS ISOLATED SECURE CHAT
                  </div>
                </div>

                <span className="bg-[#12B76A] text-white px-2 py-0.5 text-[10px] font-bold uppercase sharp-border">
                  AI MONITORING ACTIVE
                </span>
              </div>

              {/* Messages Stream */}
              <div className="p-6 space-y-4 overflow-y-auto flex-1 bg-[#F1F2F3]/40">
                {activeMessages.length === 0 ? (
                  <div className="text-center py-8 text-xs font-mono text-neutral-400">
                    No messages in thread yet.
                  </div>
                ) : (
                  activeMessages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex gap-3 ${
                        m.sender === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {m.sender !== "user" && (
                        <div
                          className={`w-7 h-7 sharp-border flex items-center justify-center font-bold text-xs text-white shrink-0 ${
                            m.sender === "agent" ? "bg-[#20C8E8]" : "bg-black"
                          }`}
                        >
                          {m.sender === "agent" ? <Bot className="w-4 h-4 text-black" /> : <User className="w-4 h-4" />}
                        </div>
                      )}

                      <div
                        className={`max-w-md p-3 sharp-border text-xs ${
                          m.sender === "user"
                            ? "bg-black text-white"
                            : m.sender === "agent"
                            ? "bg-[#20C8E8]/10 text-black border-[#20C8E8]"
                            : "bg-white text-black"
                        }`}
                      >
                        <div className="font-mono text-[9px] font-bold uppercase mb-1 opacity-70">
                          {m.sender === "user"
                            ? "YOU (SALES REP)"
                            : m.sender === "agent"
                            ? "AI AUTOPILOT AGENT"
                            : activeConv.lead_name}{" "}
                          &bull; {m.timestamp}
                        </div>
                        <p className="leading-relaxed">{m.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="p-4 border-t border-black bg-white flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type message or AI sales reply..."
                  className="flex-1 p-2.5 border border-black bg-[#F1F2F3] text-xs font-medium focus:outline-none focus:bg-white sharp-border"
                />
                <button type="submit" disabled={sending} className="btn-pill-primary text-xs">
                  <Send className="w-3.5 h-3.5 text-[#12B76A]" /> {sending ? "Sending..." : "Send Reply"}
                </button>
              </form>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
