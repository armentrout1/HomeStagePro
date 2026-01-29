import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const agentBenefits = [
  {
    title: "Win the listing presentation",
    body:
      "Show sellers an instant preview of what their empty rooms could look like. Buy a small pack to generate demo assets before you ever talk budgets.",
  },
  {
    title: "Move faster with less overhead",
    body:
      "Skip furniture rentals and install crews. Upload a clean shot, pick the room type, and download a staged version usually within a few minutes.",
  },
  {
    title: "Stay in control of disclosures",
    body:
      "Images export untouched so you can add the exact \"virtually staged\" caption or overlay your MLS requires—no hidden compliance claims.",
  },
];

const workflowSteps = [
  {
    title: "Upload & prep",
    body:
      "Use clutter-free photos shot at eye level. The uploader flags if lighting looks off and links to /real-estate-photos for quick refreshers.",
  },
  {
    title: "Select a room type",
    body:
      "Choose living, bedroom, dining, kitchen, or flex/office. Style presets aren’t live yet, but you can leave short notes to remind yourself what buyers want.",
  },
  {
    title: "Download & reuse",
    body:
      "Save the image, add your MLS disclosure, and drop it into your marketing stack. Need a new variation? Spend another credit and rerun the room.",
  },
];

const planOptions = [
  {
    name: "Quick Pack",
    price: "$9",
    description: "5 stagings to use anytime",
    bullets: [
      "High-quality AI outputs",
      "Instant downloads when rendering finishes",
      "Works for every supported room type",
    ],
    cta: { href: "/sales", label: "Get this pack" },
  },
  {
    name: "Value Pack",
    price: "$25",
    description: "20 stagings ready for active listings",
    bullets: [
      "More credits for busier teams",
      "Use anytime with secure token access",
      "Great for refreshes before new launches",
    ],
    cta: { href: "/sales", label: "View pricing" },
  },
  {
    name: "Pro Monthly",
    price: "$49",
    description: "50 stagings that refill each month",
    bullets: [
      "Predictable budget for active teams",
      "Track usage right inside the uploader",
      "Perfect for multi-listing pipelines",
    ],
    cta: { href: "/sales", label: "Talk to sales" },
  },
];

const faq = [
  {
    question: "Do you add MLS overlays or watermarks for me?",
    answer:
      "Not yet. Downloads are clean PNG/JPG files so you can add your required \"virtually staged\" label or caption before uploading to the MLS.",
  },
  {
    question: "How fast will my staged room be ready?",
    answer:
      "Most renders wrap up within a few minutes. If you want a different look, simply spend another credit and rerun the room—no ticket queue.",
  },
  {
    question: "Can I request detailed revisions?",
    answer:
      "The MVP is self-serve. Instead of a revision workflow, you re-stage a room if you want adjustments. Each rerun uses one credit.",
  },
  {
    question: "What rooms are supported today?",
    answer:
      "Living rooms, bedrooms, dining rooms, kitchens, and flex/office spaces. Style presets are on the roadmap and will roll out later.",
  },
  {
    question: "Do my credits expire?",
    answer:
      "Packs can be used any time. The Pro Monthly plan refreshes to 50 credits every 30 days so active teams always have inventory ready.",
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

const VirtualStagingForAgents = () => {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-16 px-4 py-16">
      <header className="space-y-6">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Use Case · Agents
        </p>
        <h1 className="text-4xl font-semibold">Virtual staging agents can run themselves</h1>
        <p className="text-lg text-muted-foreground">
          Upload an empty room, select the room type, and get a staged image back—usually within a few minutes. Show sellers fast proof during the listing pitch, then move straight into marketing without waiting on a studio.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/sales">Choose a Pack</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/#ai-stager">Launch AI Stager</Link>
          </Button>
        </div>
      </header>

      <section className="space-y-6">
        <h2 className="text-3xl font-semibold">Why agents like this workflow</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {agentBenefits.map((benefit) => (
            <article key={benefit.title} className="rounded-2xl border border-border p-4">
              <h3 className="text-lg font-semibold">{benefit.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{benefit.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-3xl font-semibold">How the MVP works</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {workflowSteps.map((step, index) => (
            <article key={step.title} className="rounded-2xl border border-border p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Step {index + 1}</p>
              <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
            </article>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Style presets, bulk management, and revision tooling are still on the roadmap. For now, re-run a room with another credit whenever you need a new variation.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-3xl font-semibold">Plans that match your pipeline</h2>
        <p className="text-muted-foreground">
          Buy a pack of credits as listings ramp up. All downloads are high-res files you can drop into MLS, brochures, and social after adding your disclosures.
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
        <h3 className="mt-2 text-2xl font-semibold">Need proof for your next listing presentation?</h3>
        <p className="mt-3 text-muted-foreground">
          Launch the uploader with your seller’s photos or grab a paid pack so you always have credits ready when a new property hits the pipeline.
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

      <section className="space-y-5">
        <h2 className="text-3xl font-semibold">FAQ: Virtual staging for agents</h2>
        <div className="space-y-4">
          {faq.map((item) => (
            <article key={item.question} className="rounded-2xl border border-border p-4">
              <h3 className="text-lg font-semibold">{item.question}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-muted/40 p-8">
        <h2 className="text-2xl font-semibold">Related resources</h2>
        <p className="mt-2 text-muted-foreground">
          Keep the conversation going with more guides on pricing, workflows, and visual proof designed for your clients.
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

export default VirtualStagingForAgents;
