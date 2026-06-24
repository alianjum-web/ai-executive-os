import { Card, CardContent } from "@/common/atoms/ui/card";

export function KpiCard({
    label,
    value,
    hint,
    icon: Icon,
  }: {
    label: string;
    value: string;
    hint?: string;
    icon: React.ComponentType<{ className?: string }>;
  }) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-1 font-display text-2xl font-semibold tabular-nums">
                {value}
              </p>
              {hint ? (
                <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
              ) : null}
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-blue/10 text-accent-blue">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }
  