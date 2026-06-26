import { Button } from "@/common/atoms/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/atoms/ui/card";
import { MessageSquare } from "lucide-react";
import Link from "next/link";

export function EmployeeWelcome() {
    return (
      <Card className="overflow-hidden border-accent-blue/20">
        <CardHeader>
          <p className="text-xs font-medium uppercase tracking-widest text-accent-blue">
            Welcome back
          </p>
          <CardTitle className="text-xl">Your calm workspace</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
            Ask the AI assistant about company policies and procedures. Administrators
            manage document uploads separately.
          </p>
          <Button asChild>
            <Link href="/chat">
              <MessageSquare className="h-4 w-4" />
              Open AI Assistant
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }