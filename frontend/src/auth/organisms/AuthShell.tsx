import { ThemeToggle } from "@/common/atoms/ThemeToggle";
import { AuthMarketingPanel } from "@/auth/organisms/AuthMarketingPanel";

type AuthShellProps = {
  headline: string;
  description: string;
  children: React.ReactNode;
};

export function AuthShell({ headline, description, children }: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen bg-background">
      <div className="absolute right-4 top-4 z-10 md:right-8 md:top-8">
        <ThemeToggle />
      </div>
      <AuthMarketingPanel headline={headline} description={description} />
      <section className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">{children}</div>
      </section>
    </div>
  );
}
