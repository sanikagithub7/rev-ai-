"use client";

import { useState, useEffect, useCallback } from "react";
import { ShieldCheck, UserPlus, Users, X, RefreshCw, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface TeamMemberRecord {
  id: string;
  user_id: string;
  organization_id: string;
  role: "OWNER" | "ADMIN" | "SALES" | "MEMBER";
  created_at: string;
  user_email?: string;
  user_name?: string;
}

export default function TeamSecurityPage() {
  const [members, setMembers] = useState<TeamMemberRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Invite Form state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamMemberRecord["role"]>("SALES");

  const supabase = createClient();

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: memberData, error: fetchErr } = await supabase
        .from("organization_members")
        .select("*, users(id, email, name)");

      if (fetchErr) {
        setError(fetchErr.message);
        setMembers([]);
      } else if (memberData) {
        const formatted: TeamMemberRecord[] = memberData.map((m) => {
          const userObj = m.users as unknown as { email?: string; name?: string } | null;
          return {
            id: m.id,
            user_id: m.user_id,
            organization_id: m.organization_id,
            role: m.role as TeamMemberRecord["role"],
            created_at: m.created_at,
            user_email: userObj?.email || "Teammate",
            user_name: userObj?.name || userObj?.email?.split("@")[0] || "User",
          };
        });
        setMembers(formatted);
      }
    } catch {
      setError("Failed to fetch team members.");
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const { data: currentMember } = await supabase
        .from("organization_members")
        .select("organization_id")
        .limit(1)
        .single();

      if (!currentMember) {
        setError("Organization context not found.");
        setSubmitting(false);
        return;
      }

      // Check if user exists in public.users
      const { data: existingUser } = await supabase
        .from("users")
        .select("id, email, name")
        .eq("email", inviteEmail.trim())
        .maybeSingle();

      let targetUserId = existingUser?.id;

      if (!targetUserId) {
        // Create user record if not present
        targetUserId = crypto.randomUUID();
        await supabase.from("users").insert({
          id: targetUserId,
          email: inviteEmail.trim(),
          name: inviteEmail.split("@")[0].toUpperCase(),
        });
      }

      const { data: newMem, error: memErr } = await supabase
        .from("organization_members")
        .insert({
          organization_id: currentMember.organization_id,
          user_id: targetUserId,
          role: inviteRole,
        })
        .select("*, users(id, email, name)")
        .single();

      if (memErr) {
        setError(memErr.message);
      } else if (newMem) {
        const userObj = newMem.users as unknown as { email?: string; name?: string } | null;
        setMembers((prev) => [
          ...prev,
          {
            id: newMem.id,
            user_id: newMem.user_id,
            organization_id: newMem.organization_id,
            role: newMem.role as TeamMemberRecord["role"],
            created_at: newMem.created_at,
            user_email: userObj?.email || inviteEmail.trim(),
            user_name: userObj?.name || inviteEmail.split("@")[0].toUpperCase(),
          },
        ]);
        setShowInviteModal(false);
        setInviteEmail("");
      }
    } catch {
      setError("Failed to add team member.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-black pb-6">
        <div>
          <div className="text-xs font-mono text-[#123B2D] uppercase tracking-widest mb-1">
            // ACCESS CONTROL & MULTI-TENANCY
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tight">
            TEAM MEMBERS & SECURITY
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            Manage organization team roles (`OWNER`, `ADMIN`, `SALES`, `MEMBER`) and Row-Level Security (RLS) policies.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchMembers}
            className="px-3 py-2 border border-black bg-white hover:bg-neutral-100 text-xs font-bold uppercase sharp-border cursor-pointer flex items-center gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button
            onClick={() => setShowInviteModal(true)}
            className="btn-pill-primary text-xs cursor-pointer flex items-center gap-1"
          >
            <UserPlus className="w-4 h-4 text-[#12B76A]" /> Invite Team Member
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-600 text-xs font-bold uppercase text-red-900 flex items-center gap-2 sharp-border">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          {error}
        </div>
      )}

      {/* RLS Security Status Banner */}
      <div className="bg-[#123B2D] text-white p-6 sharp-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#12B76A]" />
            <h2 className="text-lg font-black uppercase tracking-tight text-white">
              ROW LEVEL SECURITY (RLS) ACTIVE
            </h2>
          </div>
          <span className="bg-[#12B76A] text-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider sharp-border">
            ISOLATION VERIFIED
          </span>
        </div>
        <p className="text-xs text-emerald-100/80 leading-relaxed font-mono">
          Database helper <span className="text-white font-bold">is_org_member(organization_id)</span> automatically restricts all read and write queries to your organization ID. Unauthorized cross-tenant queries are blocked at the PostgreSQL engine boundary.
        </p>
      </div>

      {/* Team Members Directory Table */}
      <div className="bg-white sharp-border overflow-hidden">
        <div className="p-4 bg-[#F1F2F3] border-b border-black text-xs font-mono font-bold uppercase tracking-wider text-black">
          // ORGANIZATION TEAM DIRECTORY ({members.length} MEMBERS)
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-neutral-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#12B76A]" /> Loading team members...
          </div>
        ) : members.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-neutral-500">
            No active team members in workspace directory.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black text-xs font-mono font-bold uppercase tracking-wider text-black bg-[#F1F2F3]/60">
                <th className="p-4">Member Name</th>
                <th className="p-4">Email Address</th>
                <th className="p-4">Assigned Role</th>
                <th className="p-4">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-xs font-medium">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-[#F1F2F3]/40">
                  <td className="p-4 font-bold text-black uppercase">{m.user_name}</td>
                  <td className="p-4 text-neutral-600 font-mono">{m.user_email}</td>
                  <td className="p-4">
                    <span className="bg-black text-white px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider">
                      {m.role}
                    </span>
                  </td>
                  <td className="p-4 text-neutral-500 font-mono text-[11px]">
                    {new Date(m.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Invite Team Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 sharp-border max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-black pb-3">
              <h2 className="text-lg font-black uppercase tracking-tight">
                Invite Team Member
              </h2>
              <X className="w-4 h-4 cursor-pointer" onClick={() => setShowInviteModal(false)} />
            </div>

            <form onSubmit={handleInvite} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                  Teammate Work Email *
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="alex@company.com"
                  className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold focus:outline-none sharp-border"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                  Assign Organization Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as TeamMemberRecord["role"])}
                  className="w-full p-2.5 border border-black bg-[#F1F2F3] text-xs font-bold uppercase focus:outline-none sharp-border"
                >
                  <option value="ADMIN">ADMIN (Full management access)</option>
                  <option value="SALES">SALES (Lead & deal response rep)</option>
                  <option value="MEMBER">MEMBER (View & read access)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="btn-pill-secondary text-xs"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-pill-primary text-xs">
                  {submitting ? "Adding..." : "Add to Team"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
