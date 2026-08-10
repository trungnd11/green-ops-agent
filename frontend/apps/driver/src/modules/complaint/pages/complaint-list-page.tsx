import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@xanh/ui/skeleton";
import { Plus, ChevronRight } from "lucide-react";
import { fetchMyComplaints, createComplaint } from "../api/complaint.api";
import { formatDateTime } from "@xanh/utils";
import { StatusPill, GlassSheet, GlassButton, useToast, type PillVariant } from "../../../shared";

const STATUS_PILL: Record<string, PillVariant> = {
  pending: "warn",
  processing: "pending",
  resolved: "ok",
  rejected: "bad",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Chờ xử lý",
  processing: "Đang xử lý",
  resolved: "Đã giải quyết",
  rejected: "Đã từ chối",
};

const CATEGORIES = [
  { value: "doanh_thu", label: "Doanh thu" },
  { value: "khau_tru", label: "Khấu trừ" },
  { value: "phat", label: "Phạt" },
  { value: "khac", label: "Khác" },
];

export function ComplaintListPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const [page, setPage] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [category, setCategory] = useState("khac");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["driver-complaints", page],
    queryFn: () => fetchMyComplaints(page),
  });

  const createMut = useMutation({
    mutationFn: () => {
      const payload: { category: string; title: string; description?: string } = { category, title: title.trim() };
      if (description.trim()) payload.description = description.trim();
      return createComplaint(payload);
    },
    onSuccess: () => {
      setCreateOpen(false);
      setTitle("");
      setDescription("");
      setCategory("khac");
      qc.invalidateQueries({ queryKey: ["driver-complaints"] });
      toast.show("Khiếu nại đã được gửi");
    },
    onError: (err: Error) => toast.show(err.message, "err"),
  });

  if (isLoading) return (
    <div className="flex flex-col gap-4 p-4">
      <Skeleton variant="text" className="w-24" />
      <Skeleton variant="card" />
      <Skeleton variant="card" />
      <Skeleton variant="card" />
    </div>
  );

  return (
    <div className="screen-pad" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="row-between">
        <h1 className="h1">Khiếu nại</h1>
        <button
          type="button"
          className="btn btn-primary"
          style={{ minHeight: 44, padding: "0 16px", fontSize: 14 }}
          onClick={() => {
            setCategory("khac");
            setTitle("");
            setDescription("");
            setCreateOpen(true);
          }}
        >
          <Plus size={16} strokeWidth={2} /> Tạo khiếu nại
        </button>
      </div>

      {error && (
        <div className="card glass" style={{ borderColor: "color-mix(in oklab, var(--danger) 40%, var(--border))", color: "var(--danger)" }}>
          {error.message}
        </div>
      )}

      <div id="complaintList" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {data?.items?.map((c) => (
          <button
            key={c.id}
            type="button"
            className="card glass tap complaint"
            onClick={() => navigate({ to: `/complaints/${c.id}` } as never)}
          >
            <div className="row-between">
              <h3 className="h2" style={{ textAlign: "left" }}>{c.title}</h3>
              <StatusPill variant={STATUS_PILL[c.status] || "pending"}>{STATUS_LABEL[c.status] || c.status}</StatusPill>
            </div>
            <p className="muted" style={{ fontSize: 13, textAlign: "left" }}>{c.code} · Gửi {formatDateTime(c.createdAt)}</p>
            <div className="row-between">
              <span className="meta">{CATEGORIES.find((x) => x.value === c.category)?.label || c.category}</span>
              <ChevronRight size={16} strokeWidth={1.8} style={{ color: "var(--meta)" }} />
            </div>
          </button>
        ))}
        {(!data || data.items.length === 0) && !error && (
          <p className="meta" style={{ textAlign: "center", padding: "28px 0" }}>Bạn chưa có khiếu nại nào</p>
        )}
      </div>

      <GlassSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Tạo khiếu nại"
        description="Mô tả vấn đề để bộ phận vận hành xử lý trong 3–5 ngày làm việc."
        footer={
          <>
            <GlassButton variant="secondary" style={{ flex: 1 }} onClick={() => setCreateOpen(false)}>Hủy</GlassButton>
            <GlassButton
              style={{ flex: 1.6 }}
              isLoading={createMut.isPending}
              disabled={!title.trim() || !description.trim()}
              onClick={() => createMut.mutate()}
            >
              Gửi khiếu nại
            </GlassButton>
          </>
        }
      >
        <div className="field">
          <label htmlFor="complaintType">Loại khiếu nại</label>
          <div className="input-shell select-shell">
            <select id="complaintType" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <svg className="caret" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>
        <div className="field" style={{ marginTop: 12 }}>
          <label htmlFor="complaintTitle">Tiêu đề</label>
          <div className="input-shell">
            <input
              id="complaintTitle"
              type="text"
              placeholder="Tóm tắt vấn đề"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
        </div>
        <div className="field" style={{ marginTop: 12 }}>
          <label htmlFor="complaintBody">Nội dung</label>
          <textarea
            id="complaintBody"
            className="textarea-shell"
            placeholder="Mô tả chi tiết: ngày, chuyến, số tiền liên quan..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </GlassSheet>
    </div>
  );
}
