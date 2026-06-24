import { Card, CardContent } from "@/common/atoms/ui/card";

export function Metric({ label, value }: { label: string; value: string }) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums">
            {value}
          </p>
        </CardContent>
      </Card>
    );
  }