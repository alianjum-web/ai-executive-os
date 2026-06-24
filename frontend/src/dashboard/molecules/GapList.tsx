import { Card, CardContent, CardHeader, CardTitle } from "@/common/atoms/ui/card";


export function GapList({
    title,
    rows,
    empty,
  }: {
    title: string;
    rows: { question: string; count: number }[];
    empty: string;
  }) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">{empty}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {rows.map((row) => (
                <li
                  key={`${title}-${row.question}`}
                  className="flex justify-between gap-4 border-b border-border-subtle py-2 last:border-0"
                >
                  <span className="text-foreground">{row.question}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {row.count}×
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    );
  }