import { WelcomeHeader } from "@/welcome/molecules/WelcomeHeader";
import { WelcomeHero } from "@/welcome/molecules/WelcomeHero";
import { WelcomeFeatureGrid } from "@/welcome/organisms/WelcomeFeatureGrid";

export function WelcomeScreen() {
  return (
    <div className="min-h-screen bg-background">
      <WelcomeHeader />
      <main className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <WelcomeHero />
        <WelcomeFeatureGrid />
      </main>
    </div>
  );
}
