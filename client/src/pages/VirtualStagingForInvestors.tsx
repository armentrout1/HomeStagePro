import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const investorBenefits = [
  {
    title: "Preview finished units before punch list wraps",
    body:
      "Upload a construction photo, let the AI fill it with furniture, and reuse the render in lender decks, listings, or STR experiments without waiting for a crew.",
  },
  {
    title: "Budget-first staging",
    body:
      "Two free stagings help you test the look on a live project. Paid packs start at 5 renders for $9, so holding costs stay predictable.",
  },
  {
    title: "Control your own disclosures",
    body:
      "Downloads are untouched files; add the exact \"virtually staged\" overlay or caption your MLS or OTA requires before publishing.",
  },
];

const workflowSteps = [
  {
    title: "Upload & label rooms",
    body:
      "Use clutter-free photos shot at eye level. Tag the room type (living, bedroom, dining, kitchen, flex/office) so the AI picks the right furniture set.",
  },
  {
    title: "Let the AI render",
    body:
      "Most rooms finish within a few minutes. There is no guaranteed SLA or rush tier—just a quick render you can monitor from the uploader.",
  },
  {
    title: "Download, disclose, rerun",
    body:
      "Save the JPG/PNG, add your disclosure text, and drop it into listings or capital updates. Want a different look? Spend another credit and rerun the room.",
  },
];

const planOptions = [
  {
    name: "Free Trial",
    price: "$0",
    description: "2 stagings · no login required",
    bullets: [
      "Great for proving the concept on an active deal",
      "See renders in minutes",
      "Exports ready for your own overlays",
    ],
    cta: { href: "/#ai-stager", label: "Launch uploader" },
  },
  {
    name: "Quick Pack",
    price: "$9",
    description: "5 stagings to use anytime",
    bullets: [
      "Ideal for single flips or BRRRR projects",
      "Instant downloads as soon as rendering finishes",
      "Works for every supported room type",
    ],
    cta: { href: "/sales", label: "Get this pack" },
  },
  {
    name: "Pro Monthly",
    price: "$49",
    description: "50 stagings that refill each month",
    bullets: [
      "Predictable budget across multiple acquisitions",
      "Credits refresh every 30 days",
      "Share access by uploading from the same browser",
    ],
    cta: { href: "/sales", label: "Talk to sales" },
  },
];

const checklist = [
  {
    title: "Photo prep matters",
    body: (
      <>
        Follow the tips at {""}
        <Link href="/real-estate-photos" className="text-primary underline">
          /real-estate-photos
        </Link>{" "}
        for lighting, angles, and quick declutter wins so the AI has a clean canvas.
      </>
    ),
  },
  {
    title: "Track disclosures",
    body: (
      <>
        Keep a note that every render still needs your MLS, rental, or lender wording. Add overlays in your editor before you syndicate listings.
      </>
    ),
  },
  {
    title: "Share the demo",
    body: (
      <>
        Drop the {""}
        <Link href="/#ai-stager" className="text-primary underline">
          Try AI Stager
        </Link>{" "}
        link in investor updates so partners can watch the intake flow before approving more credits.
      </>
    ),
  },
];

const faq = [
  {
    question: "Do you offer rush delivery or SLAs?",
    answer:
      "No. Most renders complete within a few minutes, but there is no guaranteed clock or paid rush tier. Plan accordingly for investor or lender deadlines.",
  },
  {
    question: "Can I pick design styles or presets per brand?",
    answer:
      "Not yet. The MVP supports room-type selection only. Leave notes for yourself about desired vibes, and, if needed, rerun the room using another credit.",
  },
  {
    question: "How do I handle disclosures?",
    answer:
      "Images export without overlays so you can add your required \"virtually staged\" text before uploading to MLS, OTAs, or lender portals.",
  },
  {
    question: "What if the render misses something?",
    answer:
      "There is no revision queue. Simply re-stage the room—each rerun uses one credit, which keeps the workflow lightweight.",
  },
  {
    question: "Do credits expire?",
    answer:
      "One-off packs can be used anytime. The Pro Monthly plan refreshes to 50 credits every 30 days, so you always have renders ready during busy seasons.",
  },
];

const relatedResources = [
  { href: "/gallery", label: "AI staging gallery" },
  { href: "/sales", label: "Sales & onboarding workspace" },
  { href: "/virtual-staging", label: "Virtual staging overview" },
  { href: "/virtual-staging-cost", label: "Virtual staging cost breakdown" },
  {
    href: "/virtual-staging-for-real-estate-agents",
    label: "Guide for real estate agents",
  },
  {
    href: "/virtual-staging-for-investors",
    label: "Guide for investors",
  },
  { href: "/real-estate-photos", label: "Real estate photo prep" },
  { href: "/virtual-vs-traditional", label: "Virtual vs. traditional staging" },
];

const VirtualStagingForInvestors = () => {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-16 px-4 py-16">
      <header className="space-y-6">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Use Case · Investors</p>
        <h1 className="text-4xl font-semibold">Virtual staging for flips, BRRRR projects, and rentals</h1>
        <p className="text-lg text-muted-foreground">
          Run fast visuals without hiring a staging crew. Upload rooms, pick the room type, and let the AI produce a staged version—usually within a few minutes. Reuse renders in pitch decks, listings, or short-term rental tests whenever timelines get tight.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/#ai-stager">Try 2 Free Stagings</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/sales">See Paid Packs</Link>
          </Button>
        </div>
      </header>

      <section className="space-y-6">
        <h2 className="text-3xl font-semibold">Why investors use the AI stager</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {investorBenefits.map((benefit) => (
            <article key={benefit.title} className="rounded-2xl border border-border p-4">
              <h3 className="text-lg font-semibold">{benefit.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{benefit.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-3xl font-semibold">MVP workflow</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {workflowSteps.map((step, idx) => (
            <article key={step.title} className="rounded-2xl border border-border p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Step {idx + 1}</p>
              <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
            </article>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          There’s no revision queue or concierge service. Need another version? Re-stage the room with a fresh credit.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-3xl font-semibold">Credits that flex with your pipeline</h2>
        <p className="text-muted-foreground">
          Start free, then add packs when you need more renders. All downloads are high-res files you can drop into MLS, lender packets, or OTA galleries once you add disclosures.
        </p>
        <div className="grid gap-6 md:grid-cols-3">
          {planOptions.map((plan) => (
            <article key={plan.name} className="flex flex-col rounded-2xl border border-border p-6 shadow-sm">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">{plan.name}</p>
                <p className="mt-2 text-3xl font-bold">{plan.price}</p>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {plan.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Button asChild variant="outline" size="sm">
                  <Link href={plan.cta.href}>{plan.cta.label}</Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-muted/40 p-8 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">CTA</p>
        <h3 className="mt-2 text-2xl font-semibold">Have a flip or rental launching soon?</h3>
        <p className="mt-3 text-muted-foreground">
          Use the free credits for your first rooms or grab a pack so every acquisition, refi, or STR refresh has staging ready on day one.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" variant="secondary">
            <Link href="/">Try AI Stager</Link>
          </Button>
          <Button asChild size="lg">
            <Link href="/sales">See Packages &amp; Pricing</Link>
          </Button>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-3xl font-semibold">Checklist for keeping investors aligned</h2>
        <div className="space-y-4">
          {checklist.map((item) => (
            <article key={item.title} className="rounded-2xl border border-border p-4">
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="text-3xl font-semibold">FAQ</h2>
        <div className="space-y-4">
          {faq.map((entry) => (
            <article key={entry.question} className="rounded-2xl border border-border p-4">
              <h3 className="text-lg font-semibold">{entry.question}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{entry.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-muted/40 p-8">
        <h2 className="text-2xl font-semibold">Related resources</h2>
        <p className="mt-2 text-muted-foreground">
          Dive deeper into pricing, process, and visual proof libraries to support investor-facing conversations.
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {relatedResources.map((resource) => (
            <li key={resource.href}>
              <Link href={resource.href} className="text-sm font-medium text-primary underline">
                {resource.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default VirtualStagingForInvestors;
