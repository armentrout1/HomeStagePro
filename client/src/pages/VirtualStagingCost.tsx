import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const costDrivers = [
  {
    title: "Photo prep",
    copy:
      "Bright, clutter-free photos reduce cleanup time. If a shot is dark or tilted, expect to spend an extra credit rerunning the room until it looks right.",
  },
  {
    title: "Room type",
    copy:
      "Living rooms and bedrooms usually stage fastest. Kitchens or flex/office spaces can need additional reruns to showcase appliances or workspace goals.",
  },
  {
    title: "Number of angles",
    copy:
      "Each uploaded angle uses its own credit. Plan for one credit per final render you need in your listing set.",
  },
];

const packOptions = [
  {
    name: "2 free stagings",
    price: "$0",
    description: "No login required — perfect for testing",
  },
  {
    name: "Quick Pack",
    price: "$9",
    description: "5 stagings to use whenever you need them",
  },
  {
    name: "Value Pack",
    price: "$25",
    description: "20 stagings for active sellers or small teams",
  },
  {
    name: "Pro Monthly",
    price: "$49",
    description: "50 stagings that refresh every month",
  },
];

const budgetingTips = [
  {
    title: "Estimate credits per property",
    body:
      "Most listings use 3–6 rendered rooms. Multiply that by the pack that fits your cadence so you never run out mid-launch.",
  },
  {
    title: "Build disclosure time into pricing",
    body:
      "Downloads are clean JPG/PNG files. Budget a few minutes to add your local “virtually staged” caption or overlay before uploading to MLS or OTAs.",
  },
  {
    title: "Use reruns instead of revisions",
    body:
      "If a render misses the mark, rerun the room with another credit. This keeps costs transparent and avoids waiting on manual edits.",
  },
];

const faq = [
  {
    question: "How much does virtual staging cost here?",
    answer:
      "You can try two rooms for free, then buy packs: 5 for $9, 20 for $25, or 50 monthly for $49. Each render consumes one credit.",
  },
  {
    question: "How fast are the results?",
    answer:
      "Most rooms finish within a few minutes. There are no guaranteed SLAs or paid rush tiers, so queue uploads a little before you need them.",
  },
  {
    question: "Do you add disclosure overlays?",
    answer:
      "No. Files download untouched so you can add the exact wording your MLS, lender, or rental platform requires.",
  },
  {
    question: "Can I request revisions?",
    answer:
      "The MVP is self-serve. Instead of a revision button, rerun the room with another credit until you like the result.",
  },
  {
    question: "What happens if I need more credits mid-month?",
    answer:
      "You can buy another pack anytime. Monthly plans refresh automatically, while one-off packs never expire.",
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

const VirtualStagingCost = () => {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-16 px-4 py-16">
      <header className="space-y-6">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Pricing Guide</p>
        <h1 className="text-4xl font-semibold">Virtual staging costs for the HomeStage Pro MVP</h1>
        <p className="text-lg text-muted-foreground">
          Start with two free stagings (no login required), then add credits as you need them: 5 for $9, 20 for $25, or 50 monthly for $49. Each render uses one credit and usually finishes within a few minutes.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/#ai-stager">Try 2 Free Stagings</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/sales">View Pack Pricing</Link>
          </Button>
        </div>
      </header>

      <section className="space-y-6">
        <h2 className="text-3xl font-semibold">What drives your credit spend</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {costDrivers.map((factor) => (
            <article key={factor.title} className="rounded-2xl border border-border p-4">
              <h3 className="text-lg font-semibold">{factor.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{factor.copy}</p>
            </article>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          There are no rush tiers or built-in revisions. If you want a different look, just re-stage the room with another credit.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-3xl font-semibold">Pack options</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {packOptions.map((pack) => (
            <article key={pack.name} className="rounded-2xl border border-border p-4">
              <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">{pack.name}</p>
              <p className="mt-2 text-2xl font-bold">{pack.price}</p>
              <p className="text-sm text-muted-foreground">{pack.description}</p>
            </article>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          One-off packs never expire. Pro Monthly refreshes to 50 credits every 30 days so teams with regular listings always have inventory.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-3xl font-semibold">Budgeting tips</h2>
        <div className="space-y-4">
          {budgetingTips.map((tip) => (
            <article key={tip.title} className="rounded-2xl border border-border p-4">
              <h3 className="text-lg font-semibold">{tip.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{tip.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-muted/40 p-8 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">CTA</p>
        <h3 className="mt-2 text-2xl font-semibold">Plan your next upload</h3>
        <p className="mt-3 text-muted-foreground">
          Launch the uploader to spend your free credits or grab a paid pack before the next listing cycle hits.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/#ai-stager">Try 2 Free Stagings</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/sales">Buy Credits</Link>
          </Button>
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="text-3xl font-semibold">FAQ</h2>
        <div className="space-y-4">
          {faq.map((item) => (
            <article key={item.question} className="rounded-2xl border border-border p-4">
              <h3 className="text-lg font-semibold">{item.question}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.answer}</p>
            </article>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Need more detail? Pair this cost guide with the workflow overview at {""}
          <Link href="/virtual-staging" className="text-primary underline">
            /virtual-staging
          </Link>{" "}
          for sellers or investors who want to see the full intake process.
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-muted/40 p-8">
        <h2 className="text-2xl font-semibold">Related resources</h2>
        <p className="mt-2 text-muted-foreground">
          Explore complementary guides on workflow, pricing narratives, and visual proof to strengthen your cost breakdown.
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

export default VirtualStagingCost;
