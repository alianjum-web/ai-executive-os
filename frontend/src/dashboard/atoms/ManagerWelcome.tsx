import { Card, CardContent, CardHeader, CardTitle } from "@/common/atoms/ui/card";


export function ManagerWelcome() {
    return (
      <Card className="overflow-hidden border-accent-blue/20">
        <CardHeader>
          <p className="text-xs font-medium uppercase tracking-widest text-accent-blue">
            Manager view
          </p>
          <CardTitle className="text-xl">Team operations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Department-scoped tickets, analytics, and knowledge gap reports. Upload
            and integrations remain admin-only.
          </p>
        </CardContent>
      </Card>
    );
  }