import { useState, useEffect } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, Building2, Save, X } from "lucide-react";
import { notification } from "@xanh/ui/notification";
import { fetchCompany, updateCompany } from "../../admin/api/user.api";

export function CompanyEditPage() {
  const { companyId } = useParams({ from: "/_authenticated/admin/companies/$companyId/edit" });
  const navigate = useNavigate();

  const { data: company } = useQuery({
    queryKey: ["company", companyId],
    queryFn: () => fetchCompany(companyId),
    staleTime: 0,
  });

  const [form, setForm] = useState({ code: "", name: "", address: "", phone: "", email: "", taxCode: "", contactPerson: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (company) {
      setForm({
        code: company.code ?? "",
        name: company.name ?? "",
        address: company.address ?? "",
        phone: company.phone ?? "",
        email: company.email ?? "",
        taxCode: company.taxCode ?? "",
        contactPerson: company.contactPerson ?? "",
      });
    }
  }, [company]);

  const handleSubmit = async () => {
    setError("");
    if (!form.code.trim() || !form.name.trim()) {
      setError("Mã công ty và tên công ty không được để trống");
      return;
    }
    setLoading(true);
    try {
      await updateCompany(companyId, form);
      notification.success({ message: "Cập nhật công ty thành công", placement: "bottomRight" });
      navigate({ to: `/admin/companies/${companyId}` } as any);
    } catch (err: any) {
      setError(err.message || "Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-8 h-16 border-b shrink-0" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
        <button className="flex items-center justify-center w-9 h-9 rounded-btn border" style={{ borderColor: "rgba(255,255,255,0.12)", background: "#101B2B" }} onClick={() => navigate({ to: `/admin/companies/${companyId}` } as any)}>
          <ArrowLeft className="h-4 w-4 text-text-secondary" />
        </button>
        <span className="text-[13px] text-text-tertiary flex items-center gap-1.5">
          <span>Quản trị hệ thống</span>
          <ChevronRight className="h-3 w-3" />
          <span className="cursor-pointer hover:text-text-secondary" onClick={() => navigate({ to: "/admin/companies" } as any)}>Quản lý công ty</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-text-primary">Chỉnh sửa công ty</span>
        </span>
        <div className="flex-1" />
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center justify-center w-14 h-14 rounded-xl" style={{ background: "#00AEEF" }}>
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary" style={{ fontFamily: "Manrope" }}>Chỉnh sửa công ty</h1>
              <p className="text-[13px] text-text-tertiary">Cập nhật thông tin công ty</p>
            </div>
          </div>

          <div className="rounded-card border p-6" style={{ borderColor: "rgba(255,255,255,0.12)", background: "#1C2737" }}>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-text-secondary">Mã công ty</label>
                <input className="rounded-btn border px-3.5 text-[13px] text-text-primary outline-none placeholder:text-text-disabled" style={{ height: "44px", borderColor: "rgba(255,255,255,0.12)", background: "#101B2B" }} placeholder="Ví dụ: XANHVIET" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-text-secondary">Tên công ty</label>
                <input className="rounded-btn border px-3.5 text-[13px] text-text-primary outline-none placeholder:text-text-disabled" style={{ height: "44px", borderColor: "rgba(255,255,255,0.12)", background: "#101B2B" }} placeholder="Ví dụ: Công ty Cổ phần Xanh Việt" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-text-secondary">Địa chỉ</label>
                <input className="rounded-btn border px-3.5 text-[13px] text-text-primary outline-none placeholder:text-text-disabled" style={{ height: "44px", borderColor: "rgba(255,255,255,0.12)", background: "#101B2B" }} placeholder="Ví dụ: Hà Nội" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-text-secondary">Số điện thoại</label>
                <input className="rounded-btn border px-3.5 text-[13px] text-text-primary outline-none placeholder:text-text-disabled" style={{ height: "44px", borderColor: "rgba(255,255,255,0.12)", background: "#101B2B" }} placeholder="Ví dụ: 0123456789" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-text-secondary">Email</label>
                <input className="rounded-btn border px-3.5 text-[13px] text-text-primary outline-none placeholder:text-text-disabled" style={{ height: "44px", borderColor: "rgba(255,255,255,0.12)", background: "#101B2B" }} placeholder="Ví dụ: info@xanhsm.vn" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-text-secondary">Mã số thuế</label>
                <input className="rounded-btn border px-3.5 text-[13px] text-text-primary outline-none placeholder:text-text-disabled" style={{ height: "44px", borderColor: "rgba(255,255,255,0.12)", background: "#101B2B" }} placeholder="Ví dụ: 0123456789" value={form.taxCode} onChange={(e) => setForm({ ...form, taxCode: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-[13px] font-medium text-text-secondary">Người đại diện</label>
                <input className="rounded-btn border px-3.5 text-[13px] text-text-primary outline-none placeholder:text-text-disabled" style={{ height: "44px", borderColor: "rgba(255,255,255,0.12)", background: "#101B2B" }} placeholder="Ví dụ: Nguyễn Văn A" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
              </div>
            </div>
            {error && <p className="text-semantic-error text-[12px] mt-4">{error}</p>}
            <div className="flex items-center gap-3 pt-5">
              <button className="rounded-btn border px-5 h-11 text-[14px] font-medium flex items-center gap-2" style={{ borderColor: "rgba(255,255,255,0.12)", color: "#F8FAFC", background: "transparent" }} onClick={() => navigate({ to: `/admin/companies/${companyId}` } as any)}>
                <X className="h-4 w-4" /> Hủy
              </button>
              <button className="rounded-btn px-5 h-11 text-[14px] font-semibold flex items-center gap-2 disabled:opacity-60" style={{ background: "#00C7A5", color: "#F8FAFC" }} disabled={loading} onClick={handleSubmit}>
                {loading ? (
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                ) : <Save className="h-4 w-4" />}
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
