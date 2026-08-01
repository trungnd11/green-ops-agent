import { useState, useRef, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@xanh/ui";
import { Card } from "@xanh/ui/card";
import { Input } from "@xanh/ui/input";
import { Select } from "@xanh/ui/select";
import { Dialog } from "@xanh/ui/dialog";
import { notification } from "@xanh/ui/notification";
import { Badge } from "@xanh/ui/badge";
import { FormField } from "../../../shared/components/FormField";
import { DateRange } from "@xanh/ui/date-picker";
import { ArrowLeft, Upload, Plus, X, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";
import { fetchPeriods, createPeriod, importRevenue } from "../api/revenue.api";
import type { RevenuePeriod } from "../api/revenue.types";

const TYPE_LABEL: Record<string, string> = {
  daily: "Theo ngày",
  monthly: "Theo tháng",
  quarterly: "Theo quý",
  yearly: "Theo năm",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Nháp",
  imported: "Đã import",
  verified: "Đã xác thực",
  closed: "Đã đóng",
};

const STATUS_VARIANT: Record<string, string> = {
  draft: "warning",
  imported: "info",
  verified: "success",
  closed: "default",
};

const PERIOD_TYPE_OPTIONS = [
  { value: "daily", label: "Theo ngày" },
  { value: "monthly", label: "Theo tháng" },
  { value: "quarterly", label: "Theo quý" },
  { value: "yearly", label: "Theo năm" },
];

const PICKER_MAP: Record<string, "date" | "month" | "quarter" | "year"> = {
  daily: "date",
  monthly: "month",
  quarterly: "quarter",
  yearly: "year",
};

const FORMAT_MAP: Record<string, string> = {
  daily: "DD/MM/YYYY",
  monthly: "MM/YYYY",
  quarterly: "[Q]Q YYYY",
  yearly: "YYYY",
};

const PLACEHOLDER_MAP: Record<string, [string, string]> = {
  daily: ["Từ ngày", "Đến ngày"],
  monthly: ["Từ tháng", "Đến tháng"],
  quarterly: ["Từ quý", "Đến quý"],
  yearly: ["Từ năm", "Đến năm"],
};

function CreatePeriodDialog({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (period: RevenuePeriod) => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("daily");
  const [dateValue, setDateValue] = useState<{ from: string; to: string } | undefined>(undefined);

  const picker = PICKER_MAP[type];
  const dateFormat = FORMAT_MAP[type];
  const startDate = dateValue?.from || "";
  const endDate = dateValue?.to || "";

  const { mutate, isPending } = useMutation({
    mutationFn: () => createPeriod({ name, type, startDate, endDate }),
    onSuccess: (period) => {
      notification.success({ message: "Tạo kỳ doanh thu thành công", placement: "bottomRight" });
      onSuccess(period);
      onClose();
    },
    onError: (err: any) => {
      notification.error({ message: "Lỗi", description: err.message, placement: "bottomRight" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()} title="Tạo kỳ doanh thu">
      <div className="space-y-5 pt-4">
        <FormField label="Tên kỳ">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Ngày 01/04/2026" />
        </FormField>
        <FormField label="Loại kỳ">
          <Select value={type} onValueChange={setType} options={PERIOD_TYPE_OPTIONS} />
        </FormField>
        <FormField label="Thời gian">
          <DateRange
            picker={picker}
            value={dateValue}
            onChange={(val) => setDateValue(val)}
            format={dateFormat}
            placeholder={PLACEHOLDER_MAP[type]}
          />
        </FormField>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Hủy</Button>
          <Button
            variant="primary"
            onClick={() => mutate()}
            isLoading={isPending}
            disabled={!name || !startDate || !endDate}
          >
            <Plus className="h-4 w-4" /> Tạo
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function FileUploadZone({ file, onFileChange }: { file: File | null; onFileChange: (f: File | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith(".xlsx") || f.name.endsWith(".xls") || f.name.endsWith(".csv"))) {
      onFileChange(f);
    }
  }, [onFileChange]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className="relative rounded-card border-2 border-dashed p-8 text-center cursor-pointer transition-colors"
      style={{
        borderColor: dragging ? "#00C7A5" : !file ? "rgba(255,255,255,0.12)" : "rgba(0,199,165,0.3)",
        background: dragging ? "rgba(0,199,165,0.06)" : !file ? "transparent" : "rgba(0,199,165,0.04)",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={(e) => onFileChange(e.target.files?.[0] || null)}
        className="hidden"
      />

      {file ? (
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-full" style={{ background: "rgba(0,199,165,0.14)" }}>
            <CheckCircle className="h-6 w-6" style={{ color: "#00C7A5" }} />
          </div>
          <div>
            <p className="text-[14px] font-medium text-text-primary">{file.name}</p>
            <p className="text-[12px] text-text-tertiary mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onFileChange(null); }}
            className="flex items-center gap-1 text-[12px] text-semantic-error hover:underline"
          >
            <X className="h-3 w-3" /> Xóa file
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-full" style={{ background: "rgba(0,174,239,0.1)" }}>
            <FileSpreadsheet className="h-6 w-6" style={{ color: "#00AEEF" }} />
          </div>
          <div>
            <p className="text-[14px] text-text-primary">
              <span style={{ color: "#00C7A5" }}>Nhấp để chọn</span> hoặc kéo thả file
            </p>
            <p className="text-[12px] text-text-tertiary mt-0.5">.xlsx, .xls, .csv</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function RevenueImportPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [periodId, setPeriodId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data: periods, isLoading: loadingPeriods } = useQuery({
    queryKey: ["revenue", "periods"],
    queryFn: () => fetchPeriods({ page: 0, size: 200 }),
  });

  const selectedPeriod = (periods?.items || []).find((p) => p.id === periodId);

  const { mutate: doImport, isPending: importing } = useMutation({
    mutationFn: () => importRevenue(periodId, file!),
    onSuccess: (_, __, ___) => {
      notification.success({ message: "Import doanh thu thành công", placement: "bottomRight" });
      queryClient.invalidateQueries({ queryKey: ["revenue", "periods"] });
      navigate({ to: `/revenues/${periodId}` } as any);
    },
    onError: (err: any) => {
      notification.error({ message: "Lỗi", description: err.message, placement: "bottomRight" });
    },
  });

  const periodOptions = (periods?.items || []).map((p) => ({
    value: p.id,
    label: `${p.name} (${TYPE_LABEL[p.type] || p.type})`,
  }));

  return (
    <div className="relative mx-auto max-w-160 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-text-primary" style={{ fontFamily: "Manrope" }}>
            Import doanh thu
          </h1>
          <p className="text-[13px] text-text-tertiary">Chọn kỳ doanh thu và tải lên file Excel</p>
        </div>
        <button
          onClick={() => navigate({ to: "/revenues" } as any)}
          className="flex items-center justify-center w-9 h-9 rounded-btn bg-bg-subtle"
        >
          <ArrowLeft className="h-4.5 w-4.5 text-text-secondary" />
        </button>
      </div>

      <div className="rounded-card border p-6 space-y-6" style={{ borderColor: "rgba(255,255,255,0.12)", background: "#1C2737" }}>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[13px] font-medium text-text-secondary">Kỳ doanh thu</span>
            <Button
              variant="secondary"
              size="small"
              onClick={() => setShowCreate(true)}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Tạo kỳ mới
            </Button>
          </div>
          <Select
            value={periodId}
            onValueChange={setPeriodId}
            placeholder={loadingPeriods ? "Đang tải..." : "Chọn kỳ doanh thu"}
            options={periodOptions}
            disabled={loadingPeriods}
          />
        </div>

        {selectedPeriod && (
          <div className="rounded-lg p-4 space-y-2" style={{ background: "rgba(0,199,165,0.06)", border: "1px solid rgba(0,199,165,0.15)" }}>
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ background: "rgba(0,199,165,0.14)" }}>
                <AlertCircle className="h-4 w-4" style={{ color: "#00C7A5" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium text-text-primary truncate">{selectedPeriod.name}</p>
                <p className="text-[12px] text-text-tertiary">
                  {TYPE_LABEL[selectedPeriod.type] || selectedPeriod.type}
                  {selectedPeriod.startDate && ` · ${selectedPeriod.startDate.slice(0, 10)}`}
                  {selectedPeriod.endDate && ` ~ ${selectedPeriod.endDate.slice(0, 10)}`}
                </p>
              </div>
              <Badge variant={(STATUS_VARIANT[selectedPeriod.status] || "default") as any}>
                {STATUS_LABEL[selectedPeriod.status] || selectedPeriod.status}
              </Badge>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <span className="text-[13px] font-medium text-text-secondary">File Excel</span>
          <FileUploadZone file={file} onFileChange={setFile} />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <Button variant="secondary" onClick={() => navigate({ to: "/revenues" } as any)}>Hủy</Button>
          <Button
            variant="primary"
            onClick={() => doImport()}
            isLoading={importing}
            disabled={!periodId || !file}
          >
            <Upload className="h-4 w-4" /> Import
          </Button>
        </div>
      </div>

      <CreatePeriodDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={(period) => {
          setPeriodId(period.id);
          queryClient.invalidateQueries({ queryKey: ["revenue", "periods"] });
        }}
      />
    </div>
  );
}
