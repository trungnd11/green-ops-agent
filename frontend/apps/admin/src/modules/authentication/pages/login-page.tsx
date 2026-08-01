import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { ShieldCheck, ArrowLeft, Smartphone } from "lucide-react";
import { Button } from "@xanh/ui/button";
import { Input } from "@xanh/ui/input";

import { Dialog } from "@xanh/ui/dialog";
import { authStore, router } from "@/app/router";
import { loginApi, verify2FAApi, changePasswordApi, fetch2FAStatusApi, setup2FAApi, enable2FAApi } from "../../auth/api/auth.api";

const loginSchema = z.object({
  username: z.string().min(1, "Vui lòng nhập tên đăng nhập"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export function LoginPage() {
  const navigate = useNavigate();
  const [require2fa, setRequire2fa] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [username, setUsername] = useState("");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [pendingLoginData, setPendingLoginData] = useState<any>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [setupOtp, setSetupOtp] = useState("");
  const [setupOtpError, setSetupOtpError] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);
  const [forceChange, setForceChange] = useState(false);
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [changePwdError, setChangePwdError] = useState("");
  const [changePwdLoading, setChangePwdLoading] = useState(false);

  const doLogin = async (data: any) => {
    authStore.setSession({
      userId: data.userId,
      username: data.username,
      fullName: data.fullName,
      role: data.role,
      token: data.token,
      refreshToken: data.refreshToken,
      companyId: data.companyId,
      companyName: data.companyName,
      companyCode: data.companyCode,
    });
    router.options.context = {
      ...router.options.context,
      auth: { isAuthenticated: true, fullName: data.fullName, role: data.role, companyName: data.companyName },
    } as any;
    await navigate({ to: "/" });
  };

  const checkAndShow2FASetup = async (token: string) => {
    const status = await fetch2FAStatusApi();
    if (!status.enabled) {
      const setup = await setup2FAApi();
      setQrUrl(setup.qrCodeUrl ?? null);
      setShowSetup(true);
      return true;
    }
    return false;
  };

  const form = useForm({
    defaultValues: { username: "", password: "" },
    validators: {
      onChange: ({ value }: { value: { username: string; password: string } }) => {
        const result = loginSchema.safeParse(value);
        if (!result.success) {
          const fieldErrors = result.error.flatten().fieldErrors;
          return { fields: { username: fieldErrors.username?.join(", "), password: fieldErrors.password?.join(", ") } };
        }
        return undefined;
      },
    },
    onSubmit: async ({ value }) => {
      try {
        const data = await loginApi({ username: value.username, password: value.password });
        if (data.require2fa) {
          setUsername(data.username);
          setRequire2fa(true);
          return;
        }
        setUsername(data.username);
        setPendingLoginData(data);
        authStore.setSession({
          userId: data.userId, username: data.username, fullName: data.fullName,
          role: data.role, token: data.token, refreshToken: data.refreshToken,
          companyId: data.companyId, companyName: data.companyName, companyCode: data.companyCode,
        });
        if (data.forcePasswordChange) {
          setForceChange(true);
          return;
        }
        const showedSetup = await checkAndShow2FASetup(data.token);
        if (showedSetup) return;
        await doLogin(data);
      } catch (err) {
        form.setErrorMap({ onSubmit: err instanceof Error ? err.message : "Đăng nhập thất bại" });
      }
    },
  });

  const handleVerifyOtp = async () => {
    setOtpError("");
    setOtpLoading(true);
    try {
      const data = await verify2FAApi({ username, otp });
      await doLogin(data);
    } catch (err: any) {
      setOtpError(err.message || "Mã OTP không hợp lệ");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setChangePwdError("");
    if (newPwd !== confirmPwd) {
      setChangePwdError("Mật khẩu xác nhận không khớp");
      return;
    }
    if (newPwd.length < 6) {
      setChangePwdError("Mật khẩu tối thiểu 6 ký tự");
      return;
    }
    setChangePwdLoading(true);
    try {
      if (!pendingLoginData) return;
      await changePasswordApi({ newPassword: newPwd });
      setForceChange(false);
      const showedSetup = await checkAndShow2FASetup(pendingLoginData.token);
      if (showedSetup) return;
      await doLogin(pendingLoginData);
    } catch (err: any) {
      setChangePwdError(err.message || "Đổi mật khẩu thất bại");
    } finally {
      setChangePwdLoading(false);
    }
  };

  const handleSetupOTP = async () => {
    setSetupOtpError("");
    setSetupLoading(true);
    try {
      if (!pendingLoginData) return;
      await enable2FAApi(setupOtp);
      setShowSetup(false);
      await doLogin(pendingLoginData);
    } catch (err: any) {
      setSetupOtpError(err.message || "Mã OTP không hợp lệ");
    } finally {
      setSetupLoading(false);
    }
  };

  const serverError = form.useStore((state) => state.errorMap?.onSubmit);

  if (forceChange) {
    return (
      <div
        className="bg-bg-canvas relative flex min-h-screen items-center justify-center overflow-hidden px-4"
        data-app="admin"
      >
        <div
          className="h-125 w-125 absolute -left-40 -top-40 rounded-full opacity-[0.07] max-md:h-60 max-md:w-60"
          style={{ background: "radial-gradient(circle, #00AEEF 0%, transparent 70%)" }}
        />
        <div
          className="h-100 w-100 absolute -bottom-40 -right-40 rounded-full opacity-[0.08] max-md:h-48 max-md:w-48"
          style={{ background: "radial-gradient(circle, #6646B4 0%, transparent 70%)" }}
        />
        <div
          className="relative w-full max-w-[520px] overflow-hidden rounded-3xl border backdrop-blur-3xl"
          style={{ borderColor: "rgba(255,255,255,0.1)", background: "#1c273799" }}
        >
          <div className="bg-brand-teal h-1 w-full" />
          <div className="flex flex-col items-center gap-3 px-6 pt-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "#00c7a51f" }}>
              <ShieldCheck className="text-brand-teal h-7 w-7" />
            </div>
            <h1
              className="text-text-primary text-center text-[20px] font-bold tracking-wide"
              style={{ fontFamily: "Manrope" }}
            >
              Đổi mật khẩu lần đầu
            </h1>
            <p className="text-text-tertiary text-center text-[13px]">Vui lòng đặt mật khẩu mới để bảo vệ tài khoản.</p>
          </div>
          <div className="flex flex-col gap-4 px-6 pt-5">
            <div className="flex flex-col gap-1.5">
              <span className="text-text-secondary text-[13px] font-medium">Mật khẩu mới</span>
              <input
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                type="password"
                placeholder="••••••••"
                autoFocus
                className="rounded-btn text-text-primary placeholder:text-text-tertiary w-full border px-3.5 text-[13px] outline-none"
                style={{ height: "44px", borderColor: "rgba(255,255,255,0.12)", background: "#3A4352" }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-text-secondary text-[13px] font-medium">Xác nhận mật khẩu</span>
              <input
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                type="password"
                placeholder="••••••••"
                className="rounded-btn text-text-primary placeholder:text-text-tertiary w-full border px-3.5 text-[13px] outline-none"
                style={{ height: "44px", borderColor: "rgba(255,255,255,0.12)", background: "#3A4352" }}
              />
            </div>
            {changePwdError && <span className="text-semantic-error text-center text-[11px]">{changePwdError}</span>}
            <Button
              onClick={handleChangePassword}
              disabled={!newPwd || !confirmPwd || changePwdLoading}
              isLoading={changePwdLoading}
              className="!h-13 w-full text-base font-semibold"
            >
              Đổi mật khẩu
            </Button>
          </div>
          <div className="h-6" />
        </div>
      </div>
    );
  }

  if (require2fa) {
    return (
      <div
        className="bg-bg-canvas relative flex min-h-screen items-center justify-center overflow-hidden px-4"
        data-app="admin"
      >
        <div
          className="h-125 w-125 absolute -left-40 -top-40 rounded-full opacity-[0.07] max-md:h-60 max-md:w-60"
          style={{ background: "radial-gradient(circle, #00AEEF 0%, transparent 70%)" }}
        />
        <div
          className="h-100 w-100 absolute -bottom-40 -right-40 rounded-full opacity-[0.08] max-md:h-48 max-md:w-48"
          style={{ background: "radial-gradient(circle, #6646B4 0%, transparent 70%)" }}
        />
        <div
          className="max-w-130 relative w-full overflow-hidden rounded-3xl border backdrop-blur-3xl"
          style={{ borderColor: "rgba(255,255,255,0.1)", background: "#1c273799" }}
        >
          <div className="bg-brand-teal h-1 w-full" />
          <div className="flex flex-col items-center gap-3 px-6 pt-10 max-md:pt-6 max-sm:px-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "#00c7a51f" }}>
              <ShieldCheck className="text-brand-teal h-7 w-7" />
            </div>
            <h1
              className="text-text-primary text-center text-[20px] font-bold tracking-wide max-sm:text-[18px]"
              style={{ fontFamily: "Manrope" }}
            >
              Xác thực hai lớp
            </h1>
            <p className="text-text-tertiary text-center text-[13px]">
              Nhập mã OTP từ ứng dụng Authenticator để hoàn tất đăng nhập.
            </p>
          </div>
          <div className="flex flex-col gap-4 px-6 pt-5 max-sm:px-4">
            <div className="flex flex-col gap-1.5">
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Nhập 6 số"
                maxLength={6}
                autoFocus
                className="rounded-btn placeholder:text-text-tertiary w-full border px-3.5 text-center text-[20px] outline-none"
                style={{
                  height: "52px",
                  borderColor: otpError ? "#F05252" : "rgba(255,255,255,0.12)",
                  background: "#3A4352",
                  letterSpacing: "8px",
                }}
              />
              {otpError && <span className="text-semantic-error text-center text-[11px]">{otpError}</span>}
            </div>
            <Button
              onClick={handleVerifyOtp}
              disabled={otp.length !== 6}
              isLoading={otpLoading}
              className="!h-13 w-full text-base font-semibold"
            >
              Xác nhận
            </Button>
            <button
              onClick={() => setRequire2fa(false)}
              className="text-text-tertiary hover:text-text-secondary flex items-center justify-center gap-1.5 text-[13px] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Quay lại đăng nhập
            </button>
          </div>
          <div className="h-6" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-bg-canvas relative flex min-h-screen items-center justify-center overflow-hidden px-4"
      data-app="admin"
    >
      <div
        className="h-125 w-125 absolute -left-40 -top-40 rounded-full opacity-[0.07] max-md:h-60 max-md:w-60"
        style={{ background: "radial-gradient(circle, #00AEEF 0%, transparent 70%)" }}
      />
      <div
        className="h-100 w-100 absolute -bottom-40 -right-40 rounded-full opacity-[0.08] max-md:h-48 max-md:w-48"
        style={{ background: "radial-gradient(circle, #6646B4 0%, transparent 70%)" }}
      />
      <div
        className="max-w-130 relative w-full overflow-hidden rounded-3xl border backdrop-blur-3xl"
        style={{ borderColor: "rgba(255,255,255,0.1)", background: "#1c273799" }}
      >
        <div className="bg-brand-teal h-1 w-full" />
        <div className="flex flex-col items-center gap-3 px-6 pt-10 max-md:pt-6 max-sm:px-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "#00c7a51f" }}>
            <span className="text-brand-teal text-2xl" style={{ fontFamily: "Inter" }}>
              G
            </span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <h1
              className="text-text-primary text-center text-[26px] font-bold leading-none tracking-wide max-sm:text-[22px]"
              style={{ fontFamily: "Manrope" }}
            >
              GREENOPS TRANSPORT
            </h1>
            <p className="text-text-tertiary text-center text-[13px] leading-none">
              Hệ thống quản lý vận tải & tài chính thông minh
            </p>
          </div>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <div className="flex flex-col gap-4 px-6 pt-5 max-sm:px-4">
            <form.Field name="username">
              {(field) => (
                <div className="flex flex-col gap-1.5">
                  <span className="text-text-secondary text-[13px] font-medium leading-none">
                    Email / Tên đăng nhập
                  </span>
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="admin@greenops.vn"
                    hasError={!!field.state.meta.errors.length}
                    className="!h-13"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <span className="text-semantic-error text-[11px] leading-none">{field.state.meta.errors[0]}</span>
                  )}
                </div>
              )}
            </form.Field>
            <form.Field name="password">
              {(field) => (
                <div className="flex flex-col gap-1.5">
                  <span className="text-text-secondary text-[13px] font-medium leading-none">Mật khẩu</span>
                  <Input
                    type="password"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="••••••••"
                    hasError={!!field.state.meta.errors.length}
                    className="!h-13"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <span className="text-semantic-error text-[11px] leading-none">{field.state.meta.errors[0]}</span>
                  )}
                </div>
              )}
            </form.Field>

            {serverError && (
              <p className="text-semantic-error text-xs leading-none">
                {typeof serverError === "string" ? serverError : JSON.stringify(serverError)}
              </p>
            )}
          </div>
          <div className="flex flex-col items-center gap-3 px-6 pb-6 pt-5 max-sm:px-4 lg:pb-10">
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button htmlType="submit" className="!h-13 w-full text-base font-semibold" isLoading={isSubmitting}>
                  Đăng nhập
                </Button>
              )}
            </form.Subscribe>
            <p className="text-text-tertiary text-xs leading-none">Phiên bản dành cho quản trị viên</p>
          </div>
        </form>
      </div>

      <Dialog
        open={showSetup}
        onOpenChange={(open) => {
          if (!open) {
            setShowSetup(false);
            navigate({ to: "/" });
          }
        }}
      >
        <div className="flex flex-col items-center gap-4 py-2">
          <Smartphone className="text-brand-cyan h-8 w-8" />
          <div className="text-center">
            <p className="text-text-primary text-[15px] font-semibold" style={{ fontFamily: "Manrope" }}>
              Bảo vệ tài khoản của bạn
            </p>
            <p className="text-text-tertiary mt-1 text-[13px]">
              Bạn chưa thiết lập xác thực hai lớp. Quét mã QR dưới đây để tăng cường bảo mật.
            </p>
          </div>
          {qrUrl && (
            <div className="flex items-center justify-center rounded-xl p-4" style={{ background: "#fff" }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`}
                alt="QR"
                className="h-44 w-44"
              />
            </div>
          )}
          <input
            value={setupOtp}
            onChange={(e) => setSetupOtp(e.target.value)}
            placeholder="Nhập mã OTP"
            maxLength={6}
            autoFocus
            className="rounded-btn placeholder:text-text-tertiary w-full border px-3.5 text-center text-[13px] tracking-[6px] outline-none"
            style={{
              height: "44px",
              borderColor: setupOtpError ? "#F05252" : "rgba(255,255,255,0.12)",
              background: "#3A4352",
            }}
          />
          {setupOtpError && <span className="text-semantic-error -mt-2 text-[11px]">{setupOtpError}</span>}
          <div className="flex w-full gap-3">
            <button
              type="button"
              onClick={async () => {
                setShowSetup(false);
                if (pendingLoginData) await doLogin(pendingLoginData);
              }}
              className="rounded-btn h-11 flex-1 border text-[13px] font-medium"
              style={{ borderColor: "rgba(255,255,255,0.12)", color: "#F8FAFC" }}
            >
              Bỏ qua
            </button>
            <button
              type="button"
              onClick={handleSetupOTP}
              disabled={setupOtp.length !== 6 || setupLoading}
              className="rounded-btn bg-brand-teal flex h-11 flex-1 items-center justify-center gap-2 text-[13px] font-medium text-white disabled:opacity-50"
            >
              {setupLoading && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              )}
              Xác nhận
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
