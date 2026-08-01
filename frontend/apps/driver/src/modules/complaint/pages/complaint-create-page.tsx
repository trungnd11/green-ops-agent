import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Send } from "lucide-react";
import { Input } from "@xanh/ui/input";
import { Textarea } from "@xanh/ui/textarea";
import { Select } from "@xanh/ui/select";
import { Button } from "@xanh/ui/button";
import { notification } from "@xanh/ui/notification";
import { createComplaint } from "../api/complaint.api";
import { formatCurrency } from "@xanh/utils";

const CATEGORIES = [
  { value: "doanh_thu", label: "Doanh thu" },
  { value: "khau_tru", label: "Khấu trừ" },
  { value: "phat", label: "Phạt" },
  { value: "khac", label: "Khác" },
];

export function ComplaintCreatePage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState("khac");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const payload: { category: string; title: string; description?: string; amount?: number } = {
        category,
        title: title.trim(),
      };
      if (description.trim()) payload.description = description.trim();
      if (amount) payload.amount = Number(amount);
      await createComplaint(payload);
      notification.success({ message: "Gửi khiếu nại thành công", placement: "bottomRight" });
      navigate({ to: "/complaints" } as any);
    } catch (err: any) {
      notification.error({ message: "Lỗi", description: err.message, placement: "bottomRight" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate({ to: "/complaints" } as any)} className="p-1 cursor-pointer">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Tạo khiếu nại</h1>
      </div>

      <div className="rounded-card border border-border-default bg-surface-card p-4 space-y-4">
        <div>
          <label className="text-sm font-medium block mb-1">Loại</label>
          <Select
            value={category}
            onValueChange={setCategory}
            options={CATEGORIES}
          />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Tiêu đề</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nhập tiêu đề khiếu nại" />
        </div>

        <div>
            <label className="text-sm font-medium block mb-1">Số tiền (không bắt buộc)</label>
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
          {amount && <p className="text-xs text-text-tertiary mt-1">{formatCurrency(Number(amount))}</p>}
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Mô tả</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Nhập nội dung khiếu nại..."
            rows={4}
          />
        </div>

        <Button onClick={handleSubmit} isLoading={saving} className="w-full" leftIcon={<Send className="h-4 w-4" />}>
          Gửi khiếu nại
        </Button>
      </div>
    </div>
  );
}
