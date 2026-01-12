import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const VirtualStagingForAgents = () => {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-16">
      <header className="space-y-4">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Use Case
        </p>
        <h1 className="text-4xl font-semibold">
          Virtual Staging for Real Estate Agents: Win More Listings With AI
        </h1>
        <p className="text-lg text-muted-foreground">
          Bring every listing to market with MLS-safe virtual staging, overnight
          turnarounds, and proof agents can share with sellers. This placeholder
          page tees up the full BOFU experience while copy is in production.
        </p>
      </header>

      <div className="flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href="/">Try AI Stager</Link>
        </Button>
        <Button asChild size="lg" variant="secondary">
          <Link href="/sales">See Agent Packages</Link>
        </Button>
      </div>

      <p className="text-base text-muted-foreground">
        Need proof for your next listing appointment? {" "}
        <Link href="/gallery/" className="text-primary underline">
          See examples
        </Link>{" "}
        of before-and-after sets agents use to align sellers faster.
      </p>
    </div>
  );
};

export default VirtualStagingForAgents;
