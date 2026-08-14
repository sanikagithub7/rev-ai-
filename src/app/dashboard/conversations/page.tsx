"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MessageSquare as MsgIcon,
  Search as SearchIcon,
  Plus as PlusIcon,
  RefreshCw as RefreshIcon,
  Send as SendIcon,
  User as UserIcon,
  Bot as BotIcon,
  Flame as FlameIcon,
  ShieldCheck as ShieldIcon,
  AlertCircle as AlertIcon,
  CheckCircle2 as CheckIcon,
  X as XIcon,
  Clock as ClockIcon,
  Sparkles as SparklesIcon,
  ExternalLink as LinkIcon,
  Info as InfoIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Lead {
  id: string;
  name: string;
  email?: string;
  company?: string;
  status?: string;
  score?: number;
  heat_level?: string;
  metadata?: any;
}

interface MessageRecord {
  id: string;
  conversation_id: string;
  sender: "user" | "lead" | "agent";
  sender_name?: string;
  text: string;
  timestamp: string;
  created_at: string;
}

interface ConversationRecord {
  id: string;
  organization_id: string;
  lead_id?: string;
  lead_name: string;
  lead_company?: string;
  subject: string;
  channel: string;
  priority: string;
  assignee: string;
  status: "ACTIVE" | "CLOSED" | string;
  last_message: string;
  unread_count: number;
  created_at: string;
  updated_at: string;
  leads?: Lead;
}

export default function Conversations2Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leadIdQuery = searchParams.get("leadId");

  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Filters matching screenshot 3
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [priorityFilter, setPriorityFilter] = useState("All Priorities");
  const [assigneeFilter, setAssigneeFilter] = useState("All Team");

  // Message composer state
  const [replyText, setReplyText] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  // Start Conversation Modal state matching screenshot 4
  const [showStartModal, setShowStartModal] = useState(false);
  const [availableLeads, setAvailableLeads] = useState<Lead[]>([]);
  const [submittingModal, setSubmittingModal] = useState(false);

  // Modal Form Fields
  const [selectedLeadId, setSelectedLeadId] = useState<string>("NO_LEAD");
  const [subject, setSubject] = useState("");
  const [channel, setChannel] = useState("WEB");
  const [priority, setPriority] = useState("NORMAL");
  const [assignedAgent, setAssignedAgent] = useState("Unassigned");
  const [initialMessage, setInitialMessage] = useState("");

  const supabase = createClient();

  // Fetch available leads for dropdown
  const fetchLeadsForModal = useCallback(async () => {
    try {
      const res = await fetch("/api/leads");
      const data = await res.json();
      if (res.ok) {
        setAvailableLeads(data.leads || []);
      }
    } catch {
      // Ignored
    }
  }, []);

  // Fetch conversations list from Supabase API
  const fetchConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        search,
        status: statusFilter,
        priority: priorityFilter,
        assignee: assigneeFilter,
      });

      if (leadIdQuery) {
        params.append("leadId", leadIdQuery);
      }

      const res = await fetch(`/api/conversations?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to load conversations.");
        setConversations([]);
      } else {
        const list: ConversationRecord[] = data.conversations || [];
        setConversations(list);

        // Auto-select first conversation or lead query match
        if (list.length > 0 && !activeConvId) {
          setActiveConvId(list[0].id);
        }
      }
    } catch {
      setError("Failed to connect to backend server.");
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, priorityFilter, assigneeFilter, leadIdQuery, activeConvId]);

  // Fetch messages for active conversation
  const fetchMessages = useCallback(async (convId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/conversations/${convId}/messages`);
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages || []);
      } else {
        setMessages([]);
      }
    } catch {
      setMessages([]);
    } flex-1: true;
    setLoadingMessages(false);
  }, []);

  useEffect(() => {
    fetchConversations();
    fetchLeadsForModal();
  }, [fetchConversations, fetchLeadsForModal]);

  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId);
    }
  }, [activeConvId, fetchMessages]);

  // If leadId query parameter is provided, auto open start modal with lead selected
  useEffect(() => {
    if (leadIdQuery && availableLeads.length > 0) {
      const matched = availableLeads.find((l) => l.id === leadIdQuery);
      if (matched) {
        setSelectedLeadId(matched.id);
        setSubject(`Inquiry with ${matched.name} (${matched.company || "Prospect"})`);
      }
    }
  }, [leadIdQuery, availableLeads]);

  // Handle Start Conversation Form Submission
  async function handleCreateConversation(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim()) {
      setError("Subject is required.");
      return;
    }

    setSubmittingModal(true);
    setError(null);

    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: selectedLeadId,
          subject: subject.trim(),
          channel,
          priority,
          assignee: assignedAgent,
          initial_message: initialMessage.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create conversation.");
      } else if (data.conversation) {
        setToast("Conversation created successfully!");
        setShowStartModal(false);
        setSubject("");
        setInitialMessage("");
        setSelectedLeadId("NO_LEAD");
        fetchConversations();
        setActiveConvId(data.conversation.id);
        setTimeout(() => setToast(null), 4000);
      }
    } catch {
      setError("Unable to save conversation.");
    } finally {
      setSubmittingModal(false);
    }
  }

  // Handle Send Message in Thread
  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim() || !activeConvId) return;

    setSendingMsg(true);
    setError(null);

    try {
      const res = await fetch(`/api/conversations/${activeConvId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: replyText.trim(), sender: "user" }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send message.");
      } else if (data.message) {
        setMessages((prev) => [...prev, data.message]);
        setReplyText("");
        // Update conversation last message in local state
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConvId
              ? { ...c, last_message: data.message.text, updated_at: new Date().toISOString() }
              : c
          )
        );
      }
    } catch {
      setError("Failed to send message.");
    } finally {
      setSendingMsg(false);
    }
  }

  // Toggle Conversation Status (ACTIVE / CLOSED)
  async function handleToggleStatus(convId: string, currentStatus: string) {
    const newStatus = currentStatus === "CLOSED" ? "ACTIVE" : "CLOSED";
    try {
      const res = await fetch(`/api/conversations/${convId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, status: newStatus } : c))
        );
        setToast(`Conversation status updated to ${newStatus}`);
        setTimeout(() => setToast(null), 3000);
      }
    } catch {
      // Ignored
    }
  }

  const activeConv = conversations.find((c) => c.id === activeConvId);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-[#12B76A] text-white font-bold text-xs uppercase px-4 py-3 sharp-border shadow-lg flex items-center gap-2">
          <CheckIcon className="w-4 h-4" /> {toast}
        </div>
      )}

      {/* TOP HEADER CARD — MATCHING SCREENSHOT 3 EXACTLY */}
      <div className="bg-white sharp-border p-6 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-2 z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 bg-black text-white px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider sharp-border">
            <MsgIcon className="w-3 h-3 text-[#12B76A]" />
            CONVERSATIONS 2.0
          </div>

          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-black">
            BUSINESS COMMUNICATION PIPELINE
          </h1>

          <p className="text-[11px] font-mono text-neutral-600 uppercase tracking-wider">
            SERVER-VALIDATED MULTI-TENANT COMMUNICATION &bull; AI INTELLIGENCE FOUNDATION &bull; RLS PROTECTED
          </p>
        </div>

        {/* Far-Right Green Block with Action Button */}
        <div className="relative md:self-stretch flex items-center justify-end">
          <div className="hidden md:block w-28 bg-[#12B76A] absolute right-0 top-0 bottom-0 sharp-border" />
          <button
            onClick={() => setShowStartModal(true)}
            className="btn-pill-primary text-xs relative z-10 cursor-pointer shadow-md"
          >
            + START CONVERSATION
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-600 text-xs font-bold uppercase text-red-900 flex items-center gap-2 sharp-border">
          <AlertIcon className="w-4 h-4 text-red-600 shrink-0" />
          {error}
        </div>
      )}

      {/* MAIN TWO-COLUMN SPLIT WORKSPACE — MATCHING SCREENSHOT 3 EXACTLY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: CONVERSATION LIST (4 COLS) */}
        <div className="lg:col-span-4 bg-white sharp-border space-y-4 p-4 flex flex-col h-[640px]">
          {/* Search Input */}
          <div className="relative">
            <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search lead, company, subject..."
              className="w-full pl-9 pr-3 py-2 bg-[#F1F2F3] text-xs font-mono border border-black focus:outline-none focus:bg-white sharp-border"
            />
          </div>

          {/* Filter Controls Row */}
          <div className="grid grid-cols-3 gap-2 text-xs font-mono font-bold uppercase border-b border-black pb-3">
            <div>
              <label className="block text-[9px] text-neutral-500 mb-0.5">STATUS</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-1.5 border border-black bg-[#F1F2F3] text-[10px] font-bold uppercase focus:outline-none sharp-border cursor-pointer"
              >
                <option value="All Status">All Status</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>

            <div>
              <label className="block text-[9px] text-neutral-500 mb-0.5">PRIORITY</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full p-1.5 border border-black bg-[#F1F2F3] text-[10px] font-bold uppercase focus:outline-none sharp-border cursor-pointer"
              >
                <option value="All Priorities">All Priorities</option>
                <option value="LOW">LOW</option>
                <option value="NORMAL">NORMAL</option>
                <option value="HIGH">HIGH</option>
                <option value="URGENT">URGENT</option>
              </select>
            </div>

            <div>
              <label className="block text-[9px] text-neutral-500 mb-0.5">ASSIGNEE</label>
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="w-full p-1.5 border border-black bg-[#F1F2F3] text-[10px] font-bold uppercase focus:outline-none sharp-border cursor-pointer"
              >
                <option value="All Team">All Team</option>
                <option value="Unassigned">Unassigned</option>
              </select>
            </div>
          </div>

          {/* Conversation List / Loading / Empty State */}
          <div className="flex-1 overflow-y-auto divide-y divide-neutral-200">
            {loading ? (
              <div className="p-8 text-center text-xs font-mono text-neutral-500 flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-black border-t-[#12B76A] rounded-full animate-spin" />
                LOADING CONVERSATIONS...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center space-y-3 font-mono">
                <div className="text-xs font-bold uppercase text-neutral-400">NO CONVERSATIONS YET</div>
                <button
                  onClick={() => setShowStartModal(true)}
                  className="btn-pill-primary text-[10px] py-1.5 px-3 cursor-pointer"
                >
                  + START CONVERSATION
                </button>
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = conv.id === activeConvId;
                return (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    className={`p-3.5 cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-black text-white"
                        : "hover:bg-[#F1F2F3] text-black"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs uppercase tracking-tight">{conv.lead_name}</span>
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 sharp-border ${
                          isSelected
                            ? "bg-[#12B76A] text-white"
                            : "bg-[#F1F2F3] text-black border-black"
                        }`}
                      >
                        {conv.channel || "WEB"}
                      </span>
                    </div>

                    <div className={`text-[10px] font-mono font-bold uppercase ${isSelected ? "text-emerald-400" : "text-neutral-600"}`}>
                      {conv.subject}
                    </div>

                    <div className={`text-[10px] font-mono line-clamp-1 mt-1 ${isSelected ? "text-neutral-300" : "text-neutral-500"}`}>
                      {conv.last_message || "No messages yet"}
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-neutral-200/20 text-[9px] font-mono">
                      <span className={isSelected ? "text-neutral-400" : "text-neutral-400"}>
                        {new Date(conv.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className={`px-1 py-0.2 uppercase ${conv.status === "ACTIVE" ? "text-[#12B76A]" : "text-neutral-400"}`}>
                        {conv.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: DETAIL STREAM & METADATA PANEL (8 COLS) */}
        <div className="lg:col-span-8 bg-white sharp-border h-[640px] flex flex-col overflow-hidden">
          {!activeConv ? (
            /* EMPTY UNSELECTED STATE — MATCHING SCREENSHOT 3 EXACTLY */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3 bg-[#F1F2F3]/40">
              <div className="w-12 h-12 bg-white border border-black flex items-center justify-center sharp-border">
                <InfoIcon className="w-6 h-6 text-neutral-400" />
              </div>
              <div className="text-xs font-mono font-bold uppercase text-neutral-500 tracking-wider">
                SELECT A CONVERSATION TO VIEW TIMELINE & METADATA
              </div>
            </div>
          ) : (
            /* ACTIVE CONVERSATION WORKSPACE */
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              {/* Header Bar */}
              <div className="p-4 bg-[#F1F2F3] border-b border-black flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm uppercase text-black">
                      {activeConv.subject}
                    </h3>
                    <span className="bg-black text-white text-[9px] font-mono font-bold px-1.5 py-0.5">
                      {activeConv.channel}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-neutral-600 uppercase mt-0.5">
                    Lead: <span className="font-bold text-black">{activeConv.lead_name}</span> ({activeConv.lead_company || "Company"}) &bull; Priority: {activeConv.priority}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleStatus(activeConv.id, activeConv.status)}
                    className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase border border-black bg-white hover:bg-neutral-200 sharp-border cursor-pointer"
                  >
                    Status: {activeConv.status}
                  </button>

                  {activeConv.lead_id && (
                    <button
                      onClick={() => router.push(`/dashboard/leads?leadId=${activeConv.lead_id}`)}
                      className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase bg-[#12B76A] text-white sharp-border hover:bg-emerald-600 cursor-pointer flex items-center gap-1"
                    >
                      <LinkIcon className="w-3 h-3" /> Lead Profile
                    </button>
                  )}
                </div>
              </div>

              {/* Message Stream Area */}
              <div className="p-6 space-y-4 overflow-y-auto flex-1 bg-[#F1F2F3]/30 font-mono text-xs">
                {loadingMessages ? (
                  <div className="p-8 text-center text-xs text-neutral-400">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="p-8 text-center text-xs text-neutral-400">No messages in conversation thread yet.</div>
                ) : (
                  messages.map((m) => (
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
                          {m.sender === "agent" ? <BotIcon className="w-4 h-4 text-black" /> : <UserIcon className="w-4 h-4" />}
                        </div>
                      )}

                      <div
                        className={`max-w-md p-3 sharp-border text-xs ${
                          m.sender === "user"
                            ? "bg-black text-white"
                            : m.sender === "agent"
                            ? "bg-[#20C8E8]/10 text-black border-[#20C8E8]"
                            : "bg-white text-black border-black"
                        }`}
                      >
                        <div className="font-mono text-[9px] font-bold uppercase mb-1 opacity-70 flex justify-between gap-4">
                          <span>{m.sender_name || (m.sender === "user" ? "YOU" : activeConv.lead_name)}</span>
                          <span>{m.timestamp}</span>
                        </div>
                        <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Composer */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-black bg-white flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write internal communication note or message..."
                  className="flex-1 p-2.5 border border-black bg-[#F1F2F3] text-xs font-mono font-medium focus:outline-none focus:bg-white sharp-border"
                />
                <button type="submit" disabled={sendingMsg} className="btn-pill-primary text-xs cursor-pointer">
                  <SendIcon className="w-3.5 h-3.5 text-[#12B76A]" /> {sendingMsg ? "Sending..." : "SEND MESSAGE"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* START NEW CONVERSATION MODAL — MATCHING SCREENSHOT 4 EXACTLY */}
      {showStartModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white sharp-border max-w-lg w-full p-6 space-y-4 my-8">
            {/* Header Box */}
            <div className="flex items-center justify-between border-b border-black pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-[#12B76A] text-white sharp-border flex items-center justify-center font-bold text-xs">
                  💬
                </div>
                <h2 className="text-lg font-black uppercase tracking-tight text-black">
                  START NEW CONVERSATION
                </h2>
              </div>
              <XIcon className="w-5 h-5 cursor-pointer text-black hover:opacity-70" onClick={() => setShowStartModal(false)} />
            </div>

            <form onSubmit={handleCreateConversation} className="space-y-3 font-mono text-xs">
              {/* SELECT LEAD (OPTIONAL) */}
              <div>
                <label className="block font-bold uppercase mb-1">SELECT LEAD (OPTIONAL)</label>
                <select
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                  className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold uppercase focus:outline-none sharp-border cursor-pointer"
                >
                  <option value="NO_LEAD">No Lead / Direct Inquiry</option>
                  {availableLeads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.company || "Independent"})
                    </option>
                  ))}
                </select>
              </div>

              {/* SUBJECT * */}
              <div>
                <label className="block font-bold uppercase mb-1">SUBJECT *</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Enterprise Pricing Inquiry"
                  className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold focus:outline-none focus:bg-white sharp-border"
                />
              </div>

              {/* CHANNEL & PRIORITY */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase mb-1">CHANNEL</label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold uppercase focus:outline-none sharp-border cursor-pointer"
                  >
                    <option value="WEB">WEB</option>
                    <option value="EMAIL">EMAIL</option>
                    <option value="PHONE">PHONE</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase mb-1">PRIORITY</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold uppercase focus:outline-none sharp-border cursor-pointer"
                  >
                    <option value="LOW">LOW</option>
                    <option value="NORMAL">NORMAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
              </div>

              {/* ASSIGNED AGENT */}
              <div>
                <label className="block font-bold uppercase mb-1">ASSIGNED AGENT</label>
                <select
                  value={assignedAgent}
                  onChange={(e) => setAssignedAgent(e.target.value)}
                  className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold uppercase focus:outline-none sharp-border cursor-pointer"
                >
                  <option value="Unassigned">Unassigned</option>
                </select>
              </div>

              {/* INITIAL MESSAGE */}
              <div>
                <label className="block font-bold uppercase mb-1">INITIAL MESSAGE</label>
                <textarea
                  rows={3}
                  value={initialMessage}
                  onChange={(e) => setInitialMessage(e.target.value)}
                  placeholder="Write initial message or note..."
                  className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold focus:outline-none focus:bg-white sharp-border"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-neutral-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowStartModal(false)}
                  className="px-6 py-2.5 border border-black bg-[#F1F2F3] text-xs font-bold uppercase hover:bg-neutral-200 sharp-border cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={submittingModal}
                  className="btn-pill-primary text-xs cursor-pointer"
                >
                  {submittingModal ? "CREATING..." : "CREATE CONVERSATION"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
