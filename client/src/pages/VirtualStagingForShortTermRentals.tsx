import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const benefits = [
  {
    title: "Refresh galleries fast",
    body:
      "Upload a current photo, pick the room type, and download a staged version usually within a few minutes—perfect for OTA refreshes between guests.",
  },
  {
    title: "No concierges required",
    body:
      "Everything happens inside the AI uploader. Purchase a starter pack to test the look, then scale credits to match your booking cadence.",
  },
  {
    title: "You control disclosures",
    body:
      "Files download untouched so you can add the exact “virtually staged” caption each platform expects before publishing.",
  },
];

const workflowSteps = [
  {
    title: "Upload room photos",
    body:
      "Use clutter-free shots of living rooms, bedrooms, kitchens, or flex areas. Each angle consumes one credit.",
  },
  {
    title: "Select the room type",
    body:
      "Choose from the supported room list (living, bedroom, dining, kitchen, flex/office). There are no style presets yet, but you can note ideas for yourself.",
  },
  {
    title: "Download & rerun",
    body:
      "Grab the JPG/PNG, add your disclosure overlay, and drop it into Airbnb or VRBO. Want a different vibe? Spend another credit and rerun the room.",
  },
];

const packOptions = [
  {
    name: "Quick Pack",
    price: "$9",
    description: "5 stagings for weekend refreshes",
  },
  {
    name: "Value Pack",
    price: "$25",
    description: "20 stagings for host teams",
  },
  {
    name: "Pro Monthly",
    price: "$49",
    description: "50 stagings refreshed each month",
  },
];

const faq = [
  {
    question: "How fast do renders finish?",
    answer:
      "Most rooms complete within a few minutes. There are no guaranteed SLAs or express tiers, so upload slightly ahead of your listing deadline.",
  },
  {
    question: "Do you add the Airbnb/VRBO disclosure for me?",
    answer:
      "No. Downloads are clean files so you can add the exact wording your platform requires before hitting publish.",
  },
  {
    question: "Can I choose styles or presets?",
    answer:
      "Not yet. Room-type selection is available today, and styles are on the roadmap. If you need another look, rerun the room with a new credit.",
  },
  {
    question: "What happens if the render isn’t right?",
    answer:
      "There’s no revision queue. Simply rerun the room—each attempt uses one credit and finishes quickly.",
  },
  {
    question: "Do credits expire?",
    answer:
      "One-off packs never expire. Pro Monthly refreshes every 30 days so active hosts always have credits on hand.",
  },
];

const VirtualStagingForShortTermRentals = () => {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-16 px-4 py-16">
      <header className="space-y-5">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Use Case · Short-Term Rentals</p>
        <h1 className="text-4xl font-semibold">Virtual staging for Airbnb, VRBO, and boutique stays</h1>
        <p className="text-lg text-muted-foreground">
          Show guests what the stay feels like before they arrive. Upload a photo, pick the room type, and get a staged version back—usually within a few minutes.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/sales">Choose a Pack</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/#ai-stager">Launch AI Stager</Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">No discovery calls, no concierge—just a self-serve tool built for hosts who need fast visuals.</p>
      </header>

      <section className="space-y-6">
        <h2 className="text-3xl font-semibold">Why hosts use the AI stager</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {benefits.map((benefit) => (
            <article key={benefit.title} className="rounded-2xl border border-border p-4">
              <h3 className="text-lg font-semibold">{benefit.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{benefit.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-3xl font-semibold">MVP workflow for STR hosts</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {workflowSteps.map((step, index) => (
            <article key={step.title} className="rounded-2xl border border-border p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Step {index + 1}</p>
              <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
            </article>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">No human stylists, discovery calls, or approval loops. Everything is self-serve, and reruns simply use another credit.</p>
      </section>

      <section className="space-y-6">
        <h2 className="text-3xl font-semibold">Pack options for STR refreshes</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {packOptions.map((pack) => (
            <article key={pack.name} className="rounded-2xl border border-border p-4">
              <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">{pack.name}</p>
              <p className="mt-2 text-2xl font-bold">{pack.price}</p>
              <p className="text-sm text-muted-foreground">{pack.description}</p>
            </article>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">Credits never expire unless you opt into the monthly plan. Monthly packs refresh automatically so you’re ready for seasonal updates.</p>
      </section>

      <section className="rounded-2xl border border-border bg-muted/40 p-8 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">CTA</p>
        <h3 className="mt-2 text-2xl font-semibold">Update your gallery before peak season</h3>
        <p className="mt-3 text-muted-foreground">
          Launch the uploader now, or grab a pack so every listing refresh comes with polished visuals and accurate disclosures you control.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/sales">Choose a Pack</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/#ai-stager">Launch AI Stager</Link>
          </Button>
        </div>
      </section>

      <section className="space-y-8">
        <h2 className="text-3xl font-semibold">
          Common Mistakes to Avoid in STR Virtual Staging
        </h2>
        <div className="space-y-6 text-muted-foreground">
          <div>
            <h3 className="text-2xl font-semibold text-foreground">
              Overcrowding and Space Misrepresentation
            </h3>
            <p>
              Adding too many pieces makes small footprints feel cramped and can
              invite poor reviews. We keep scale accurate, use realistic shadows, and
              provide disclosure language so no guest feels misled when they arrive.
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-foreground">
              Inconsistent Branding Across Listings
            </h3>
            <p>
              Operators running across multiple markets need cohesive styling. We
              maintain palette, props, and typography cues so your entire portfolio
              feels intentional whether guests discover you via social ads or the
              main site at{" "}
              <Link href="/virtual-staging" className="text-primary underline">
                /virtual-staging
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-3xl font-semibold">FAQ</h2>
        <div className="space-y-4">
          {faq.map((item) => (
            <article key={item.question} className="rounded-2xl border border-border p-5">
              <h3 className="text-xl font-semibold">{item.question}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default VirtualStagingForShortTermRentals;
