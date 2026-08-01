import { useNavigate } from '@tanstack/react-router';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { LogIn } from 'lucide-react';
import { Button } from '@xanh/ui/button';
import { Input } from '@xanh/ui/input';
import { authStore, router } from '../../../app/router';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Vui lòng nhập mã tài xế hoặc SĐT'),
});

export function LoginPage() {
  const navigate = useNavigate();

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
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-bg-canvas overflow-hidden" data-app="driver">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] opacity-[0.06]" style={{ background: 'radial-gradient(circle, #00AEEF 0%, transparent 70%)' }} />

      <div className="relative w-[calc(100%-32px)] max-w-[400px] overflow-hidden rounded-3xl border backdrop-blur-3xl" style={{ borderColor: 'rgba(255,255,255,0.1)', background: '#1c2737f2' }}>
        <div className="h-1 w-full bg-brand-teal" />

        <div className="flex flex-col items-center px-6 pt-8" style={{ gap: '12px' }}>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: '#00c7a51f' }}>
            <span className="text-xl text-brand-teal" style={{ fontFamily: 'Inter' }}>G</span>
          </div>
          <div className="flex flex-col items-center" style={{ gap: '12px' }}>
            <h1 className="text-xl font-bold text-text-primary tracking-wide leading-none" style={{ fontFamily: 'Manrope' }}>GREENOPS TRANSPORT</h1>
            <p className="text-xs text-text-tertiary leading-none">Đối tác tài xế</p>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
          <div className="flex flex-col px-6" style={{ gap: '12px', paddingTop: '20px' }}>
            <form.Field name="identifier">
              {(field) => (
                <div className="flex flex-col" style={{ gap: '6px' }}>
                  <span className="text-[13px] font-medium text-text-secondary leading-none">Mã tài xế / SĐT</span>
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Nhập mã tài xế hoặc SĐT"
                    hasError={!!field.state.meta.errors.length}
                    className="!h-[48px]"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <span className="text-[11px] text-semantic-error leading-none mt-0.5">{field.state.meta.errors[0]}</span>
                  )}
                </div>
              )}
            </form.Field>

            {serverError && (
              <p className="text-xs text-semantic-error leading-none" role="alert">{serverError}</p>
            )}
          </div>

          <div className="flex flex-col items-center px-6" style={{ gap: '12px', paddingTop: '20px', paddingBottom: '28px' }}>
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button htmlType="submit" className="!h-[48px] w-full text-base font-semibold" isLoading={isSubmitting} leftIcon={<LogIn className="h-5 w-5 mr-1.5" />}>
                  Đăng nhập
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </div>
    </div>
  );
}
