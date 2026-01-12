import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const heroStats = [
  { label: "Avg. DOM Reduction", value: "-9 days", detail: "Fix & flip comps" },
  { label: "Offer Lift", value: "+2 offers", detail: "Post-refresh listings" },
  {
    label: "Rental Premium",
    value: "+7%",
    detail: "Occupancy + ADR combined",
  },
];

const packages = [
  {
    name: "Starter Flip",
    detail: "10 credits/mo, 24h turnaround, MLS disclosures bundled.",
    bestFor: "Single-property flips or wholetail projects under contract.",
  },
  {
    name: "BRRRR Bundle",
    detail:
      "30 credits, batch uploads, bulk staging credits with locked pricing.",
    bestFor: "Portfolio builders juggling acquisition + refinance timelines.",
  },
  {
    name: "STR & Rental Portfolio",
    detail:
      "60+ credits, style presets per brand, optional rush tiers and STR captions.",
    bestFor: "Operators modernizing entire rental or STR books each quarter.",
  },
];

const workflowSteps = [
  {
    title: "Intake flow tuned for multi-property uploads",
    copy:
      "Drag in full photo sets, tag asset types, and apply style presets once. Bulk staging credits keep per-room spend predictable, and collaborators can leave underwriting notes before renders start.",
  },
  {
    title: "Turnaround guarantees + rush windows",
    copy:
      "Standard deliveries land inside 24 hours, 12-hour rush tiers cover hot listings, and 48-hour windows block time for 30+ photo drops. Status pings keep lenders and listing partners synced while you manage contractors.",
  },
  {
    title: "Revision safety net for ROI protection",
    copy:
      "Need to swap furniture styles or highlight premium finishes? Every order includes guided revisions with annotated comments so the final renders align with appraisal goals and rent-ready narratives.",
  },
];

const workflowChecklist = [
  {
    title: "Photo capture standards per asset type",
    copy:
      "Follow the prep cues from our photography partners at ",
    link: { href: "/real-estate-photos", label: "/real-estate-photos" },
    suffix:
      " for lighting, angles, and quick declutter wins so AI staging looks inspection-ready.",
  },
  {
    title: "Batch upload + approval workflow",
    copy:
      "Use bulk staging credits to queue multiple assets, then route proofs to partners for sign-off. Approvals, revisions, and disclosures are logged so auditors can track each flip or BRRRR property.",
  },
  {
    title: "Secondary CTA for platform demo",
    copy:
      "Drop a Try AI Stager prompt in investor updates so stakeholders can preview the uploader at ",
    link: { href: "/", label: "/" },
    suffix: " before allocating more capital to marketing.",
  },
  {
    title: "Seller and renter education",
    copy:
      "Share prep guides from ",
    link: { href: "/selling-tips", label: "/selling-tips" },
    suffix:
      " to align expectations on disclosure language, repairs, and photography day timelines.",
  },
];

const faq = [
  {
    question:
      "How does virtual staging improve returns for flips or BRRRR deals?",
    answer:
      "Faster DOM trims holding costs—every week saved can remove a mortgage payment, tax escrow, and utilities. For BRRRR projects, refreshed visuals speed lease-up so you can hit seasoning requirements sooner and lock a better refinance.",
  },
  {
    question: "What disclosures keep buyers and renters informed?",
    answer:
      "HomeStage Pro embeds subtle overlays plus caption templates you can paste into MLS and OTA descriptions. Reference the comparison guide at /virtual-vs-traditional when explaining cost savings without hiding that images are staged.",
  },
  {
    question: "How fast can you turn around 10+ rooms on a deadline?",
    answer:
      "Standard sets return within 24 hours and rush upgrades deliver in 12. For bulk drops, schedule 48-hour windows so our team pre-allocates stylists—ideal when you’re racing toward list dates or lender photo requirements.",
  },
  {
    question: "What happens if a render misses the design direction?",
    answer:
      "Every order includes structured revision rounds. Tag what needs to change, request alternate furnishings, or call out renovation items still in progress. We’ll adjust lighting, finishes, and decor until it matches the investment story.",
  },
  {
    question: "Can I manage bulk workflows for recurring acquisitions?",
    answer:
      "Yes. Bulk staging credits, shared asset libraries, and role-based logins let operating partners, assistants, and lenders track progress without slowing approvals. It’s built for portfolios cycling new deals monthly.",
  },
];

const VirtualStagingForInvestors = () => {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-16 px-4 py-16">
      <header className="space-y-6">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Use Case · Investors
        </p>
        <h1 className="text-4xl font-semibold">
          Virtual Staging Built for Deal-Driven Investors
        </h1>
        <p className="text-lg text-muted-foreground">
          Compress timelines on fix-and-flip, BRRRR, and rental assets with AI
          staging that keeps budgets lean while presenting every unit as if it is
          inspection-ready. HomeStage Pro combines disclosure-safe renders,
          predictable SLAs, and gallery proof you can share with buyers, lenders,
          or short-term rental guests.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/sales">See Investor Packages</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/">Try AI Stager</Link>
          </Button>
        </div>
        <div className="grid gap-4 rounded-xl border p-4 sm:grid-cols-3">
          {heroStats.map((stat) => (
            <div key={stat.label}>
              <p className="text-sm uppercase tracking-wide text-muted-foreground">
                {stat.label}
              </p>
              <p className="text-3xl font-semibold text-primary">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.detail}</p>
            </div>
          ))}
        </div>
      </header>

      <section className="space-y-8">
        <h2 className="text-3xl font-semibold">
          Why Investors Are Upgrading to AI-Ready Staging
        </h2>
        <div className="space-y-6 text-muted-foreground">
          <div>
            <h3 className="text-2xl font-semibold text-foreground">
              Holding costs vs. faster DOM math for flips and BRRRR
            </h3>
            <p>
              Time is the tax on every project. When virtually staged photos cut
              nine days from DOM, flippers save nearly two mortgage payments and
              HOA or hard-money interest. BRRRR operators get leases signed sooner,
              so seasoning clocks start earlier and appraisers see a fully merch
              space instead of a construction zone.
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-foreground">
              Where virtual staging beats traditional staging on cost
            </h3>
            <p>
              Physical installs require movers, furniture inventory, and vacant
              timelines. Virtual staging lets you market while contractors finish
              punch lists. Share the full cost breakdown at{" "}
              <Link
                href="/virtual-vs-traditional"
                className="text-primary underline"
              >
                /virtual-vs-traditional
              </Link>{" "}
              to show partners why digital-first visuals protect margins without
              sacrificing polish.
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-foreground">
              Compliance and disclosure guardrails
            </h3>
            <p>
              MLS boards now expect visible overlays, and marketplace platforms
              require captions noting virtual staging. HomeStage Pro bakes in those
              disclosures, stores audit logs, and links directly to the technology
              overview at{" "}
              <Link href="/virtual-staging" className="text-primary underline">
                /virtual-staging
              </Link>{" "}
              so you can reassure buyers, tenants, and lender partners that every
              asset is marketed transparently.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <h2 className="text-3xl font-semibold">
          Investor-Focused Workflow with Predictable Turnarounds
        </h2>
        <div className="space-y-6 text-muted-foreground">
          {workflowSteps.map((step) => (
            <div key={step.title}>
              <h3 className="text-2xl font-semibold text-foreground">
                {step.title}
              </h3>
              <p>{step.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-3xl font-semibold">Packages and Pricing Signals</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {packages.map((pkg) => (
            <div key={pkg.name} className="rounded-2xl border p-4">
              <h3 className="text-xl font-semibold">{pkg.name}</h3>
              <p className="text-sm text-muted-foreground">{pkg.detail}</p>
              <p className="text-sm font-medium text-foreground">{pkg.bestFor}</p>
            </div>
          ))}
        </div>
        <p className="text-muted-foreground">
          Bundle staging credits with the pricing deck at{" "}
          <Link href="/sales" className="text-primary underline">
            /sales
          </Link>{" "}
          so capital partners can line-item marketing in every pro forma. When
          comparing against physical installs, cite the savings outlined above and
          the disclosure-ready renders that keep lender audits clean.
        </p>
      </section>

      <section className="space-y-8">
        <h2 className="text-3xl font-semibold">
          Proof That Staging Moves Metrics Investors Care About
        </h2>
        <div className="space-y-6 text-muted-foreground">
          <div>
            <h3 className="text-2xl font-semibold text-foreground">
              Fix &amp; flip listing refresh (DOM + offer lift)
            </h3>
            <p>
              A downtown condo flip relaunched with staged living, office, and
              balcony scenes. The asset shaved nine days off DOM and added two
              competing offers, lifting net proceeds by $18K. Show the before/after
              proof deck from{" "}
              <Link href="/gallery/" className="text-primary underline">
                /gallery/
              </Link>{" "}
              during lender updates to keep financing conversations warm.
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-foreground">
              Rental/STR listing conversion (occupancy + ADR lift)
            </h3>
            <p>
              A coastal STR operator restaged suites and common areas, then pushed
              refreshed photos to OTAs. Occupancy jumped 12% and ADR climbed $31
              per night without increasing marketing spend. Pair the visuals with
              pro photo tips from{" "}
              <Link
                href="/real-estate-photos"
                className="text-primary underline"
              >
                /real-estate-photos
              </Link>{" "}
              to prove every space was captured correctly.
            </p>
          </div>
          <div className="rounded-2xl border p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
              Proof CTA
            </p>
            <p className="mt-3 text-xl font-semibold text-foreground">
              Need more comps for partners or lenders?
            </p>
            <p className="mt-2 text-muted-foreground">
              Browse the investor-focused gallery and download case-study decks
              you can embed in capital updates.
            </p>
            <Button asChild className="mt-4" size="lg">
              <Link href="/gallery/">View Investor Results Gallery</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <h2 className="text-3xl font-semibold">
          Implementation Checklist for Busy Portfolios
        </h2>
        <div className="space-y-6 text-muted-foreground">
          {workflowChecklist.map((item) => (
            <div key={item.title}>
              <h3 className="text-2xl font-semibold text-foreground">
                {item.title}
              </h3>
              <p>
                {item.copy}
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

      <section className="space-y-6">
        <h2 className="text-3xl font-semibold">
          FAQ: Investor Objections, Returns, and Workflow
        </h2>
        <div className="space-y-4">
          {faq.map((item) => (
            <div key={item.question} className="rounded-2xl border p-5">
              <h3 className="text-xl font-semibold">{item.question}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default VirtualStagingForInvestors;
