import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const priceFactors = [
  {
    title: "Photo quality & prep",
    copy:
      "High-res, decluttered photos cut editing time and keep pricing at the lower end of the $20–$75 range. Phone photos with glare or tilt often need premium edits.",
  },
  {
    title: "Style complexity",
    copy:
      "Designing luxury, hospitality, or themed STR sets requires more art direction than clean modern rooms, increasing per-photo cost.",
  },
  {
    title: "Revision + rush needs",
    copy:
      "Packages typically include one revision. Extra rounds or 12-hour rush windows add $5–$15 per photo compared to 24–48h standard delivery.",
  },
];

const packageModels = [
  {
    title: "Per-photo credits",
    copy:
      "Great for testing the workflow or staging 1–5 hero rooms. Expect $25–$60/photo with one revision and MLS disclosure baked in.",
  },
  {
    title: "Starter / Growth bundles",
    copy:
      "Monthly packages (10–30 credits) keep per-photo rates closer to $22–$45 while adding account sharing and faster support.",
  },
  {
    title: "Portfolio + investor plans",
    copy:
      "Bulk credits over 50 photos unlock sub-$20 effective CPM, batch uploads, and scheduled production windows for BRRRR or STR operators.",
  },
];

const roiBlocks = [
  {
    title: "Listing agents",
    copy:
      "If a $8K staging investment saves nine DOM, the holding-cost savings plus higher offer volume typically beat ad spend. Reference workflow details at ",
    link: { href: "/virtual-staging", label: "/virtual-staging" },
    suffix:
      " when pitching sellers so they understand deliverables and compliance.",
  },
  {
    title: "Investors & BRRRR teams",
    copy:
      "Quicker lease-up and polished appraisal photos help with refinance timelines. Compare digital vs physical overhead using the guide at ",
    link: { href: "/virtual-vs-traditional", label: "/virtual-vs-traditional" },
    suffix:
      " to justify why virtual-first marketing protects spreads on each deal.",
  },
  {
    title: "STR & rental operators",
    copy:
      "Before/after visuals can raise ADR $20–$40 without new furniture purchases. Share proof from ",
    link: { href: "/gallery/", label: "/gallery/" },
    suffix:
      " so partners see how refreshed visuals lift occupancy and reviews.",
  },
];

const faq = [
  {
    question: "What is the average cost per virtually staged photo in 2026?",
    answer:
      "Most providers charge $20–$75 per photo depending on photo prep, style complexity, and turnaround. Bulk credits or subscriptions can push the rate under $20 when you commit to ongoing volume.",
  },
  {
    question: "Do packages include revisions or are they extra?",
    answer:
      "HomeStage Pro includes one full revision round plus minor tweaks for color or decor. Additional iterations are priced per scene, but subscribers often receive complimentary quick edits.",
  },
  {
    question: "How does turnaround time affect pricing?",
    answer:
      "Standard 24-hour delivery is baked into most plans. A 12-hour rush fee typically adds $5–$15 per image, while 48-hour bulk windows can reduce per-photo cost for drops over 30 rooms.",
  },
  {
    question: "Are MLS disclosures and watermarks included?",
    answer:
      "Yes. Compliance overlays, caption templates, and watermarking are included so every render is safe for MLS, portals, and STR platforms without surprise fees.",
  },
  {
    question: "Can investors or brokerages get bulk discounts?",
    answer:
      "Portfolio bundles offer locked-in pricing, shared credits, and role-based logins. Reach out via ",
    link: { href: "/sales", label: "/sales" },
    suffix:
      " to map volume tiers or create a BRRRR-specific credit bank.",
  },
  {
    question:
      "Is virtual staging still cheaper than traditional installs for luxury or STR listings?",
    answer:
      "Usually yes—digital sets avoid furniture rental, movers, and storage. Physical staging still shines for ultra-luxury open houses or occupied homes, but many teams combine both: virtual first, select physical installs later.",
  },
];

const relatedResources = [
  { href: "/gallery/", label: "AI staging gallery" },
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
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Pricing Guide
        </p>
        <h1 className="text-4xl font-semibold">How Much Does Virtual Staging Cost?</h1>
        <p className="text-lg text-muted-foreground">
          In 2026, virtual staging typically ranges from $20 to $75 per photo.
          The final number depends on source-photo quality, style complexity,
          revision needs, and whether you require 12-hour rush delivery or
          standard 24–48 hour timelines. Use this guide to benchmark offers,
          compare per-photo vs package pricing, and decide when physical staging
          is still worth the spend.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/sales">See Packages &amp; Pricing</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/gallery/">View Examples</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/virtual-staging">What is Virtual Staging?</Link>
          </Button>
        </div>
      </header>

      <section className="space-y-8">
        <h2 className="text-3xl font-semibold">
          Virtual Staging Pricing Overview for 2026
        </h2>
        <div className="space-y-6 text-muted-foreground">
          <div>
            <h3 className="text-2xl font-semibold text-foreground">
              Average price ranges per photo and per room
            </h3>
            <p>
              Expect a baseline of $25–$45 per photo for residential listings,
              $40–$75 for luxury or STR suites, and discounted effective rates
              when bundling entire room sets. Rooms that require multiple angles
              or lifestyle props may count as two credits per space.
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-foreground">
              What drives cost in 2026
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              {priceFactors.map((factor) => (
                <div key={factor.title} className="rounded-2xl border p-4">
                  <h4 className="text-lg font-semibold">{factor.title}</h4>
                  <p className="text-sm text-muted-foreground">{factor.copy}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-foreground">
              Turnaround time pricing for 12h, 24h, and 48h delivery
            </h3>
            <p>
              24-hour service is the standard SLA. Twelve-hour rush surcharges
              cater to agents pushing a live MLS date, while 48-hour windows
              allow teams to stage 30+ rooms at a discount. Coordinate timelines
              alongside your photographer or media partner at{" "}
              <Link
                href="/real-estate-photos"
                className="text-primary underline"
              >
                /real-estate-photos
              </Link>{" "}
              to avoid paying elevated fees due to incomplete photo sets.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <h2 className="text-3xl font-semibold">Per-Photo vs Package Models</h2>
        <div className="space-y-6 text-muted-foreground">
          {packageModels.map((pkg) => (
            <div key={pkg.title}>
              <h3 className="text-2xl font-semibold text-foreground">
                {pkg.title}
              </h3>
              <p>{pkg.copy}</p>
            </div>
          ))}
          <p>
            For predictable pipelines, package bundles paired with scheduled
            production windows keep marketing budgets in check. Compare the tiers
            inside the pricing deck at{" "}
            <Link href="/sales" className="text-primary underline">
              /sales
            </Link>{" "}
            to see how per-photo rates drop as you scale.
          </p>
        </div>
      </section>

      <section className="space-y-8">
        <h2 className="text-3xl font-semibold">
          When to Choose Virtual vs Traditional Staging
        </h2>
        <div className="space-y-6 text-muted-foreground">
          <div>
            <h3 className="text-2xl font-semibold text-foreground">
              Cost comparison table
            </h3>
            <p>
              Virtual staging averages $25–$60 per scene, while full physical
              installs often exceed $2,500 per project. Use the comparison guide
              at{" "}
              <Link
                href="/virtual-vs-traditional"
                className="text-primary underline"
              >
                /virtual-vs-traditional
              </Link>{" "}
              to illustrate inventory, logistics, and holding-cost tradeoffs for
              sellers or investors.
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-foreground">
              When physical staging still wins
            </h3>
            <p>
              Luxury homes hosting broker tours, or occupied properties where
              buyers need tactile cues, can still benefit from physical installs.
              Many teams run virtual staging first to pre-market the listing, then
              upgrade a handful of rooms physically once demand is validated.
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-foreground">
              Hybrid workflow: virtual first, physical later
            </h3>
            <p>
              Launch with virtual assets to capture leads and gather feedback.
              If a room emerges as the hero space, invest in physical staging for
              tours. This hybrid approach keeps marketing agile without blowing
              budgets on every property.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <h2 className="text-3xl font-semibold">
          ROI Framing for Agents, Investors, and STR Hosts
        </h2>
        <div className="space-y-6 text-muted-foreground">
          {roiBlocks.map((block) => (
            <div key={block.title}>
              <h3 className="text-2xl font-semibold text-foreground">
                {block.title}
              </h3>
              <p>
                {block.copy}
                <Link href={block.link.href} className="text-primary underline">
                  {block.link.label}
                </Link>
                {block.suffix}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-3xl font-semibold">
          CTA Modules to Book Packages and See Proof
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border p-5">
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
              CTA #1
            </p>
            <h3 className="mt-2 text-xl font-semibold">See Pricing &amp; Packages</h3>
            <p className="text-sm text-muted-foreground">
              Compare Starter, Growth, and Portfolio plans, then lock in rush tiers.
            </p>
            <Button asChild className="mt-4" size="lg">
              <Link href="/sales">Go to /sales</Link>
            </Button>
          </div>
          <div className="rounded-2xl border p-5">
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
              CTA #2
            </p>
            <h3 className="mt-2 text-xl font-semibold">Explore Before/After Gallery</h3>
            <p className="text-sm text-muted-foreground">
              Download proof decks to share with clients, investors, or lenders.
            </p>
            <Button asChild className="mt-4" size="lg" variant="secondary">
              <Link href="/gallery/">Go to /gallery/</Link>
            </Button>
          </div>
          <div className="rounded-2xl border p-5">
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
              CTA #3
            </p>
            <h3 className="mt-2 text-xl font-semibold">How Virtual Staging Works</h3>
            <p className="text-sm text-muted-foreground">
              Walk through the workflow, disclosures, and QA process step by step.
            </p>
            <Button asChild className="mt-4" size="lg" variant="outline">
              <Link href="/virtual-staging">Go to /virtual-staging</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-3xl font-semibold">
          FAQ: Pricing, Policies, and Scaling
        </h2>
        <div className="space-y-4">
          {faq.map((item) => (
            <div key={item.question} className="rounded-2xl border p-5">
              <h3 className="text-xl font-semibold">{item.question}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {item.answer}
                {item.link && (
                  <Link href={item.link.href} className="text-primary underline">
                    {item.link.label}
                  </Link>
                )}
                {item.suffix}
              </p>
            </div>
          ))}
        </div>
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
