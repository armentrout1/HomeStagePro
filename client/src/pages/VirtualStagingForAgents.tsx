import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const stats = [
  { label: "Days on Market", value: "-9 days", detail: "vs. unstaged comps" },
  {
    label: "Offer Volume",
    value: "+37%",
    detail: "buyers submit faster with visuals",
  },
  {
    label: "Seller Confidence",
    value: "92%",
    detail: "agents close pricing conversations",
  },
];

const packages = [
  {
    name: "Solo Agent",
    description:
      "Up to 10 virtually staged photos/month for listing agents juggling a lean pipeline.",
    bestFor: "Ideal for agents who need MLS-compliant visuals within 24h.",
  },
  {
    name: "Team",
    description:
      "30 photo credits, rush upgrades, and shared brand libraries for small teams.",
    bestFor:
      "Perfect for top producers who pitch multiple sellers weekly and need collaboration tools.",
  },
  {
    name: "Brokerage",
    description:
      "Unlimited seats, onboarding concierge, and co-branded marketing assets.",
    bestFor:
      "Designed for broker-owners who want every agent pitching the same AI staging workflow.",
  },
];

const turnaroundTiers = [
  {
    label: "12h Rush",
    detail: "For hot listings, includes proactive QA and live chat check-ins.",
  },
  {
    label: "24h Standard",
    detail: "Default SLA covering most agent submissions, even during peak.",
  },
  {
    label: "48h Bulk",
    detail:
      "For plan sets above 30 photos, scheduled production windows keep launches predictable.",
  },
];

const faq = [
  {
    question:
      "Will MLS boards require a disclosure for virtually staged images?",
    answer:
      "Yes—most boards in 2026 ask for a subtle overlay or caption noting the image is virtually staged. HomeStage Pro auto-applies MLS-compliant text and watermarks so you never forget the disclosure.",
  },
  {
    question:
      "How should I align seller expectations between virtual and physical staging?",
    answer:
      "Position virtual staging as the fastest way to visualize a style direction, then decide if a room warrants a physical install. Share our comparison guide at /virtual-vs-traditional to highlight budget and timeline differences.",
  },
  {
    question: "What is the real turnaround time during busy listing season?",
    answer:
      "Standard delivery is still 24 hours. Rush submissions can be turned around in 12 hours, and large brokerage drops are scheduled in 48-hour windows so you can promise a firm go-live date.",
  },
  {
    question: "Can I request revisions if the furnishings miss the brief?",
    answer:
      "Absolutely. Every order includes one full revision round plus quick tweaks for color accents, furniture swaps, or decor edits. Threaded comments keep sellers, photographers, and our stylists aligned.",
  },
  {
    question: "What photo requirements ensure the best results?",
    answer:
      "Upload at least 3000px-wide images, capture each space from two angles, and declutter personal items when possible. Our team can brighten, straighten, and patch minor imperfections, but clean source files make staging look real.",
  },
];

const VirtualStagingForAgents = () => {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-16 px-4 py-16">
      <header className="space-y-6">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Use Case · Agents
        </p>
        <h1 className="text-4xl font-semibold">
          Virtual Staging for Real Estate Agents: Win More Listings With AI
        </h1>
        <p className="text-lg text-muted-foreground">
          Equip every listing with MLS-safe visuals, predictable turnarounds,
          and seller-ready proof. HomeStage Pro blends an AI-powered intake with
          human QA so you can pitch confidently, win the pricing conversation,
          and take properties live within 24 hours.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/">Try AI Stager</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/sales">See Agent Packages</Link>
          </Button>
        </div>
        <div className="grid gap-4 rounded-xl border p-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="space-y-1 text-center sm:text-left">
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
          Why Competitive Agents Rely on Virtual Staging Now
        </h2>
        <div className="space-y-6 text-muted-foreground">
          <div>
            <h3 className="text-xl font-semibold text-foreground">
              Data points: DOM, offer count, and buyer engagement lifts
            </h3>
            <p>
              Buyers expect polished visuals before they ever request a tour.
              Listings staged through HomeStage Pro average nine fewer days on
              market and see a 37% lift in total offers. The uptick is even
              higher for condos and new construction where comparison shopping is
              brutal. Pair this analysis with your own market comps to show
              sellers exactly where AI staging narrows the gap.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground">
              Agent pain points (budget, inventory gaps, seller pressure)
            </h3>
            <p>
              Traditional staging requires inventory, movers, and a seller who is
              willing to vacate. With virtual staging you stay under budget,
              avoid storage logistics, and still present a finished concept in
              every photo. Agents on leaner commission splits can move faster,
              keep more revenue, and redirect savings into media packages at{" "}
              <Link href="/real-estate-photos" className="text-primary underline">
                /real-estate-photos
              </Link>
              .
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground">
              Compliance snapshot: what MLS boards expect in 2026
            </h3>
            <p>
              Boards across the country now publish explicit virtual staging
              requirements. Our intake form references those rules, adds
              disclosure overlays, and logs proof for your brokerage. Share this
              compliance-first approach during listing presentations alongside
              the guidance we cover at{" "}
              <Link
                href="/virtual-staging"
                className="text-primary underline"
              >
                /virtual-staging
              </Link>{" "}
              so sellers understand you are not experimenting—you adhere to MLS
              policy every time.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <h2 className="text-3xl font-semibold">
          HomeStage Pro Workflow Tailored to Listing Teams
        </h2>
        <div className="space-y-6 text-muted-foreground">
          <div>
            <h3 className="text-xl font-semibold text-foreground">
              Intake: photo checklist, seller questionnaire, compliance flagging
            </h3>
            <p>
              Start with our guided uploader: drag in photography, select room
              archetypes, and tag any seller notes. We highlight missing angles,
              flag reflective surfaces that need edits, and confirm whether the
              MLS requires text overlays. Even phone photos work once our system
              cleans lighting and perspective.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground">
              AI + designer QA flow: style matching, MLS overlays, approval loop
            </h3>
            <p>
              Our AI matches mood boards with furniture templates, then human
              stylists refine every layer. MLS disclosures are embedded
              automatically and you receive a proof deck that is safe for{" "}
              <Link
                href="/virtual-vs-traditional"
                className="text-primary underline"
              >
                /virtual-vs-traditional
              </Link>{" "}
              comparisons. Approve the set or request edits without leaving the
              portal.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground">
              Collaboration tools: shareable proofs, seller comment threads
            </h3>
            <p>
              Each order has a public share link for sellers, plus comment
              threads so you can capture objections in one place. Sellers can ask
              for staging tweaks while you keep the conversation moving toward a
              signed listing agreement.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-3xl font-semibold">
          Packages, Turnaround Guarantees, and ROI Talking Points
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {packages.map((pkg) => (
            <div key={pkg.name} className="space-y-2 rounded-xl border p-4">
              <h3 className="text-xl font-semibold">{pkg.name}</h3>
              <p className="text-sm text-muted-foreground">{pkg.description}</p>
              <p className="text-sm font-medium text-foreground">{pkg.bestFor}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-4 rounded-xl bg-muted/60 p-6 text-muted-foreground sm:grid-cols-3">
          {turnaroundTiers.map((tier) => (
            <div key={tier.label}>
              <p className="text-lg font-semibold text-foreground">
                {tier.label}
              </p>
              <p>{tier.detail}</p>
            </div>
          ))}
        </div>
        <p className="text-muted-foreground">
          Use these numbers during seller consultations: a standard $600k listing
          that closes nine days faster can save two mortgage payments and boosts
          agent commission velocity. Cross-reference cost-per-listing math with
          the pricing deck at{" "}
          <Link href="/sales" className="text-primary underline">
            /sales
          </Link>{" "}
          so every homeowner understands the ROI.
        </p>
      </section>

      <section className="rounded-2xl bg-primary/5 p-8 text-center shadow-sm">
        <p className="text-sm uppercase tracking-[0.3em] text-primary">
          Pricing Banner
        </p>
        <h3 className="mt-2 text-2xl font-semibold">
          Ready-made packages for solo agents, teams, and brokerages
        </h3>
        <p className="mt-3 text-muted-foreground">
          See everything that is included in each subscription, then connect with
          sales to customize rush tiers or onboarding for your office.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/sales">See Agent Packages</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/sales">Chat with Sales</Link>
          </Button>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-3xl font-semibold">
          Proof Agents Can Show Sellers and Buyers
        </h2>
        <div className="space-y-4 text-muted-foreground">
          <div>
            <h3 className="text-xl font-semibold text-foreground">
              Before/after gallery highlight
            </h3>
            <p>
              Pull a full set of ready-to-share collateral from our gallery. Each
              transformation includes MLS labeling, metadata, and download links.
              Browse the library at{" "}
              <Link href="/gallery/" className="text-primary underline">
                /gallery/
              </Link>{" "}
              and bring a curated proof deck to your next listing appointment.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground">
              Scenario #1: Downtown condo refresh for relocation sellers
            </h3>
            <p>
              A vacant two-bedroom condo downtown needed to attract remote buyers
              who could not tour in person. We staged in a contemporary style,
              added skyline reflections, and included a short video loop so
              relocation clients could visualize the space instantly. The unit
              received four offers in 48 hours.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground">
              Scenario #2: Suburban family home flip with pre-list demand
            </h3>
            <p>
              Investors prepping a suburban flip wanted to pre-sell the property
              while contractors wrapped punch-list items. We staged the great room
              and outdoor living spaces to highlight lifestyle shots, helping the
              team secure weekend showings before work was complete.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-3xl font-semibold">
          Implementation Checklist & Next Best Actions
        </h2>
        <div className="space-y-4 text-muted-foreground">
          <div>
            <h3 className="text-xl font-semibold text-foreground">
              Photo prep + file handoff workflow
            </h3>
            <p>
              Whether you use a phone or pro photographer, follow the prep guide
              at{" "}
              <Link
                href="/selling-tips"
                className="text-primary underline"
              >
                /selling-tips
              </Link>{" "}
              for decluttering, window pulls, and lighting adjustments. Upload
              directly into HomeStage Pro and we will handle file optimization.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground">
              Co-branded pitch deck + Try AI Stager CTA
            </h3>
            <p>
              Need collateral for your listing consultation? Download the
              co-branded deck, swap screenshots for local comps, and embed the{" "}
              <Link href="/" className="text-primary underline">
                Try AI Stager
              </Link>{" "}
              CTA on the final slide so homeowners can watch the intake flow
              before you leave.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground">
              Sales consultation CTA module
            </h3>
            <p>
              When you are ready for volume pricing or brokerage onboarding,
              schedule a session with our revenue team at{" "}
              <Link href="/sales" className="text-primary underline">
                /sales
              </Link>
              . We will map credits to your pipeline and set up access for
              assistants or transaction coordinators.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
          Next Steps
        </p>
        <h3 className="mt-3 text-2xl font-semibold">
          Keep agents focused on listings, not logistics
        </h3>
        <p className="mt-3 text-muted-foreground">
          Bundle virtual staging with pro photography, media rights, and
          marketing templates from{" "}
          <Link href="/real-estate-photos" className="text-primary underline">
            /real-estate-photos
          </Link>
          . When you are ready, jump straight into an upload or connect with
          sales for a deeper walkthrough.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/sales">Book a Sales Consult</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Try AI Stager</Link>
          </Button>
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="text-3xl font-semibold">
          FAQ: Virtual Staging for Real Estate Agents
        </h2>
        <div className="space-y-4">
          {faq.map((item) => (
            <div key={item.question} className="rounded-xl border p-4">
              <h3 className="text-xl font-semibold">{item.question}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default VirtualStagingForAgents;
