import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const steps = [
  {
    title: "Upload your rooms",
    description:
      "Drop empty or under-furnished listing photos into the AI stager intake. Flag quirks, finishes, and disclosure language so we can stay MLS compliant from the start.",
  },
  {
    title: "Pick a design direction",
    description:
      "Select one of our curated interior style presets or describe the buyer profile you are targeting. We align render sets to the listing narrative before production begins.",
  },
  {
    title: "24-hour AI + designer render",
    description:
      "Our hybrid workflow blends AI ideation with human retouching for lighting, window views, and accurate scale. Expect first proofs in 24 hours for standard queues.",
  },
  {
    title: "Download MLS-ready files",
    description:
      "Approve finals and download full-resolution JPGs plus disclosure overlays. Assets are ready for MLS, social cuts, and listing presentations instantly.",
  },
];

const HowItWorks = () => {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-14 px-4 py-20">
      <header className="space-y-6 text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
          Workflow Overview
        </p>
        <h1 className="text-4xl font-semibold text-foreground">
          How HomeStage Pro Delivers Turnkey Virtual Staging
        </h1>
        <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
          Upload, style, approve, and publish staged rooms in a single session. Our
          process is optimized for quick agent intake, 24-hour turnarounds, and
          instant downloads you can drop into your MLS or pitch decks.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/#ai-stager">Start in the AI Stager</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/sales">Talk to Sales</Link>
          </Button>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        {steps.map((step, index) => (
          <article
            key={step.title}
            className="rounded-3xl border border-border/80 bg-background/80 p-6 shadow-sm"
          >
            <span className="text-sm font-semibold text-primary">
              Step {index + 1}
            </span>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              {step.title}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">{step.description}</p>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-primary/40 bg-primary/5 p-8 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-primary">
          Proof on Deck
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-foreground">
          Want to see the renders this workflow produces?
        </h2>
        <p className="mt-4 text-base text-muted-foreground">
          Browse before-and-after sets, client wins, and style boards inside our
          <Link href="/gallery/" className="text-primary underline">
            {" gallery showcase"}
          </Link>
          . Use the same intake flow to recreate those results for your next
          listing.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/#ai-stager">Launch the AI Stager</Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="/sales">Book a Sales Call</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default HowItWorks;
