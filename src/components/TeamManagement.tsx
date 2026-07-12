"use client";

import { api } from "@/trpc/react";
import { toast } from "sonner";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import {
  CheckCircle2Icon, XCircleIcon, BanIcon, UserMinusIcon,
  CopyIcon, ClockIcon, ShieldCheckIcon, EyeIcon, PencilIcon,
} from "lucide-react";

const thCl = "py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500";
const cardBg = "bg-white border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrator",
  FLEET_MANAGER: "Fleet Manager",
  DISPATCHER: "Dispatcher",
  SAFETY_OFFICER: "Safety Officer",
  FINANCE: "Financial Analyst",
};

function StatusBadge({ approved, blocked }: { approved: boolean; blocked: boolean }) {
  if (blocked) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-red-50 text-red-700 border-red-200/50">
        <BanIcon className="size-3" /> Blocked
      </span>
    );
  }
  if (!approved) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-amber-50 text-amber-700 border-amber-200/50">
        <ClockIcon className="size-3" /> Pending
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200/50">
      <ShieldCheckIcon className="size-3" /> Active
    </span>
  );
}

function PermissionToggle({
  permission,
  onToggle,
  disabled,
}: {
  permission: string;
  onToggle: () => void;
  disabled: boolean;
}) {
  const isWrite = permission === "WRITE";
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
        isWrite
          ? "bg-[#eef6f2] text-[#0d5c3a] border-emerald-200/50 hover:bg-emerald-100"
          : "bg-slate-50 text-slate-500 border-slate-200/50 hover:bg-slate-100"
      }`}
      title={isWrite ? "Click to set View Only" : "Click to set Write access"}
    >
      {isWrite ? (
        <>
          <PencilIcon className="size-3" /> Write
        </>
      ) : (
        <>
          <EyeIcon className="size-3" /> View Only
        </>
      )}
    </button>
  );
}

export default function TeamManagement() {
  const utils = api.useUtils();
  const { data, isLoading } = api.team.list.useQuery();

  const invalidate = () => utils.team.list.invalidate();

  const approve = api.team.approve.useMutation({
    onSuccess: () => { toast.success("User approved"); invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const reject = api.team.reject.useMutation({
    onSuccess: () => { toast.success("Request rejected"); invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const setBlock = api.team.setBlockStatus.useMutation({
    onSuccess: (_, vars) => {
      toast.success(vars.blocked ? "User blocked" : "User unblocked");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const remove = api.team.remove.useMutation({
    onSuccess: () => { toast.success("User removed from board"); invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const setPerm = api.team.setPermission.useMutation({
    onSuccess: (_, vars) => {
      toast.success(vars.permission === "WRITE" ? "Write access granted" : "Set to View Only");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const fallbackCopyText = (text: string) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      if (successful) {
        toast.success("Board ID copied to clipboard");
      } else {
        toast.error("Failed to copy Board ID");
      }
    } catch (err) {
      console.error("Fallback copy failed: ", err);
      toast.error("Failed to copy Board ID");
    }
  };

  const copyBoardId = () => {
    if (!data?.boardId) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(data.boardId)
        .then(() => {
          toast.success("Board ID copied to clipboard");
        })
        .catch((err) => {
          console.error("Failed to copy with navigator.clipboard: ", err);
          fallbackCopyText(data.boardId);
        });
    } else {
      fallbackCopyText(data.boardId);
    }
  };

  if (isLoading) {
    return (
      <div className={`${cardBg} p-6`}>
        <p className="text-xs text-slate-500">Loading team members…</p>
      </div>
    );
  }

  const pending = data?.members.filter((m) => !m.approved) ?? [];
  const active = data?.members.filter((m) => m.approved) ?? [];

  return (
    <div className="space-y-5">
      {/* Board invite code */}
      <div className={`${cardBg} p-5`}>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Board Invite Code</p>
        <div className="flex items-center gap-3">
          <code className="text-lg font-bold text-[#0d5c3a] tracking-wider" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
            {data?.boardId}
          </code>
          <button
            onClick={copyBoardId}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#eef6f2] text-[#0d5c3a] text-xs font-bold hover:bg-emerald-100 transition-all cursor-pointer"
          >
            <CopyIcon className="size-3.5" /> Copy
          </button>
        </div>
        <p className="text-[11px] text-slate-400 mt-2">Share this code so others can request to join your board.</p>
      </div>

      {/* Pending requests */}
      {pending.length > 0 && (
        <div className={`${cardBg}`}>
          <div className="px-5 pt-5 pb-2 flex items-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pending Join Requests</p>
            <span className="inline-flex items-center justify-center size-5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
              {pending.length}
            </span>
          </div>
          <Table>
            <TableHeader>
              <TableRow style={{ borderBottom: "1px solid #f1f3f5" }}>
                {["Name", "Email", "Role", "Requested", "Actions"].map((h, i) => (
                  <TableHead key={h} className={`${thCl} ${i === 0 ? "pl-5" : ""} ${i === 4 ? "pr-5 text-right" : ""}`}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pending.map((m) => (
                <TableRow key={m.id} style={{ borderBottom: "1px solid #f1f3f5" }}>
                  <TableCell className="py-3.5 pl-5 font-semibold text-slate-800">{m.name}</TableCell>
                  <TableCell className="py-3.5 text-slate-500 text-xs">{m.email}</TableCell>
                  <TableCell className="py-3.5 text-slate-500 text-xs">{ROLE_LABELS[m.role] ?? m.role}</TableCell>
                  <TableCell className="py-3.5 text-slate-400 text-xs">
                    {new Date(m.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </TableCell>
                  <TableCell className="py-3.5 pr-5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => approve.mutate({ id: m.id })}
                        disabled={approve.isPending}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0d5c3a] text-white text-[11px] font-bold hover:bg-[#064e3b] transition-all cursor-pointer"
                      >
                        <CheckCircle2Icon className="size-3" /> Approve
                      </button>
                      <button
                        onClick={() => reject.mutate({ id: m.id })}
                        disabled={reject.isPending}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 text-[11px] font-bold hover:bg-red-100 transition-all cursor-pointer"
                      >
                        <XCircleIcon className="size-3" /> Reject
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* All board members */}
      <div className={`${cardBg}`}>
        <div className="px-5 pt-5 pb-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Board Members</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow style={{ borderBottom: "1px solid #f1f3f5" }}>
              {["Name", "Email", "Role", "Permission", "Status", "Actions"].map((h, i) => (
                <TableHead key={h} className={`${thCl} ${i === 0 ? "pl-5" : ""} ${i === 5 ? "pr-5 text-right" : ""}`}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {active.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-slate-400 text-xs">
                  No approved members yet. Share your board invite code to get started.
                </TableCell>
              </TableRow>
            ) : (
              active.map((m) => (
                <TableRow key={m.id} style={{ borderBottom: "1px solid #f1f3f5" }}>
                  <TableCell className="py-3.5 pl-5 font-semibold text-slate-800">{m.name}</TableCell>
                  <TableCell className="py-3.5 text-slate-500 text-xs">{m.email}</TableCell>
                  <TableCell className="py-3.5 text-slate-500 text-xs">{ROLE_LABELS[m.role] ?? m.role}</TableCell>
                  <TableCell className="py-3.5">
                    <PermissionToggle
                      permission={m.permission}
                      disabled={setPerm.isPending}
                      onToggle={() =>
                        setPerm.mutate({
                          id: m.id,
                          permission: m.permission === "WRITE" ? "VIEW_ONLY" : "WRITE",
                        })
                      }
                    />
                  </TableCell>
                  <TableCell className="py-3.5">
                    <StatusBadge approved={m.approved} blocked={m.blocked} />
                  </TableCell>
                  <TableCell className="py-3.5 pr-5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {m.blocked ? (
                        <button
                          onClick={() => setBlock.mutate({ id: m.id, blocked: false })}
                          disabled={setBlock.isPending}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold hover:bg-emerald-100 transition-all cursor-pointer"
                        >
                          <CheckCircle2Icon className="size-3" /> Unblock
                        </button>
                      ) : (
                        <button
                          onClick={() => setBlock.mutate({ id: m.id, blocked: true })}
                          disabled={setBlock.isPending}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-[11px] font-bold hover:bg-amber-100 transition-all cursor-pointer"
                        >
                          <BanIcon className="size-3" /> Block
                        </button>
                      )}
                      <button
                        onClick={() => remove.mutate({ id: m.id })}
                        disabled={remove.isPending}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 text-[11px] font-bold hover:bg-red-100 transition-all cursor-pointer"
                      >
                        <UserMinusIcon className="size-3" /> Remove
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
