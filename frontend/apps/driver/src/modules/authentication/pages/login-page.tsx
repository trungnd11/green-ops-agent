import { useNavigate } from '@tanstack/react-router';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { LogIn } from 'lucide-react';
import { authStore, router } from '../../../app/router';
import { useTheme, ModePill, useToast } from '../../../shared';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Vui lòng nhập mã tài xế hoặc SĐT'),
});

export function LoginPage() {
  const navigate = useNavigate();
  const { theme, setMode } = useTheme();
  const toast = useToast();

  const form = useForm({
    defaultValues: { identifier: '' },
    validators: {
      onChange: ({ value }: { value: { identifier: string } }) => {
        const result = loginSchema.safeParse(value);
        if (!result.success) {
          const fieldErrors = result.error.flatten().fieldErrors;
          return {
            fields: {
              identifier: fieldErrors.identifier?.join(', '),
            },
          };
        }
        return undefined;
      },
    },
    onSubmit: async ({ value }) => {
      try {
        const session = await authStore.login(value.identifier);
        router.options.context = {
          ...router.options.context,
          auth: {
            isAuthenticated: true,
            fullName: session.fullName,
          },
        } as any;
        toast.show('Đăng nhập thành công');
        navigate({ to: '/' });
      } catch (err) {
        form.setErrorMap({
          onSubmit: err instanceof Error ? err.message : 'Đăng nhập thất bại',
        });
      }
    },
  });

  const serverError = form.useStore((state) => state.errorMap?.onSubmit);

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden" data-app="driver">
      <div className="wall" aria-hidden="true">
        <div className="blob t1" />
        <div className="blob t2" />
        <div className="blob t3" />
      </div>

      <div className="login-top relative z-10">
        <ModePill theme={theme} onSelect={setMode} />
      </div>

      <div className="login-wrap relative z-10">
        <div className="login-logo">
          <div className="brand-mark">G</div>
          <div className="text-center">
            <div className="login-brand">GREENOPS</div>
            <div className="login-sub">Đối tác tài xế</div>
          </div>
        </div>

        <form className="login-card glass" onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} noValidate>
          <form.Field name="identifier">
            {(field) => (
              <div className="field">
                <label htmlFor="loginId">Mã tài xế / SĐT</label>
                <div className={`input-shell ${field.state.meta.errors.length > 0 ? 'err' : ''}`}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="8" r="4" />
                    <path d="M4.5 20a6.5 6.5 0 0 1 13 0" />
                  </svg>
                  <input
                    id="loginId"
                    type="text"
                    placeholder="Nhập mã tài xế hoặc SĐT"
                    autoComplete="username"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
                {field.state.meta.errors.length > 0 && (
                  <p className="meta" style={{ color: 'var(--danger)' }}>{field.state.meta.errors[0]}</p>
                )}
              </div>
            )}
          </form.Field>

          {typeof serverError === 'string' && serverError && (
            <p className="meta" style={{ color: 'var(--danger)' }} role="alert">{serverError}</p>
          )}

          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? (
                  <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 3a9 9 0 1 0 9 9" />
                  </svg>
                ) : (
                  <LogIn className="h-[18px] w-[18px]" strokeWidth={1.9} />
                )}
                Đăng nhập
              </button>
            )}
          </form.Subscribe>
          <p className="login-demo">Demo: nhập bất kỳ nội dung để vào ứng dụng</p>
        </form>
      </div>
    </div>
  );
}
