import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const packages = [
  {
    name: "Starter",
    tagline: "5 rooms • ideal for listing agents testing virtual staging",
    highlights: [
      "48-hour turnaround",
      "1 revision cycle included",
      "MLS-safe disclosure overlays",
    ],
  },
  {
    name: "Growth",
    tagline: "15 rooms • built for multi-listing teams & investors",
    highlights: [
      "Dedicated concierge intake",
      "Rush delivery available",
      "Style harmonization across assets",
    ],
  },
  {
    name: "Portfolio",
    tagline: "Unlimited credits • STR hosts & portfolio operators",
    highlights: [
      "Bulk pricing + API hooks",
      "Quarterly lookbook refresh",
      "Priority QA + white-glove support",
    ],
  },
];

const proofSets = [
  {
    title: "Urban condo refresh",
    caption:
      "Listing agent cut DOM by 9 days after swapping listing photos with these renders.",
  },
  {
    title: "Suburban family home flip",
    caption:
      "Investor secured full-price offers within 72 hours by showcasing an aspirational family room.",
  },
  {
    title: "STR moodboard montage",
    caption:
      "Airbnb host aligned decor with seasonal demand and boosted occupancy by 18%.",
  },
];

const faqs = [
  {
    question: "Will MLS boards accept virtually staged images from HomeStage Pro?",
    answer:
      "Yes. Every render includes subtle disclosure text and follows local MLS guidance so reviewers can approve assets without delays.",
  },
  {
    question: "How realistic do AI-generated furnishings look compared to real staging?",
    answer:
      "Our hybrid AI + designer QA process ensures lighting, shadows, and perspective match the photo so buyers can’t spot the difference.",
  },
  {
    question: "What photo quality do you need from my photographer or phone?",
    answer:
      "We recommend 12MP DSLR exports, but modern smartphones work if you follow our framing checklist from the upload flow.",
  },
  {
    question: "How fast can you turn projects around during peak listing season?",
    answer:
      "Standard delivery lands in 24–48 hours. Growth and Portfolio clients can add rush processing for same-day needs.",
  },
  {
    question: "Can I request edits if a room style misses the mark?",
    answer:
      "Absolutely. Every package includes at least one revision cycle, and Portfolio members receive unlimited micro-adjustments.",
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

const VirtualStaging = () => {
  const filteredResources = relatedResources.filter(
    (resource) => resource.href !== "/virtual-staging",
  );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-16 px-4 py-16">
      <section className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-14 text-white shadow-2xl">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-300">
          Cornerstone Service
        </p>
        <h1 className="mt-4 text-4xl font-semibold">
          Virtual Staging Services for Modern Listings
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-slate-200">
          Stand up polished listing visuals in hours, not weeks. Our AI-driven
          workflow infuses designer judgment, MLS compliance, and ROI proof so
          your listings feel move-in ready across every channel.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <div className="rounded-xl border border-white/20 px-4 py-3 text-sm text-slate-200">
            Avg. +18% CTR on listing portals
          </div>
          <div className="rounded-xl border border-white/20 px-4 py-3 text-sm text-slate-200">
            24–48h turnaround windows
          </div>
        </div>
        <div className="mt-10">
          <Button asChild size="lg" className="bg-white text-slate-900 hover:bg-slate-100">
            <Link href="/sales">Start My Staging Plan</Link>
          </Button>
        </div>
      </section>

      <section className="space-y-8">
        <div>
          <h2 className="text-3xl font-semibold">Why Modern Listings Need Virtual Staging Now</h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Buyer journeys live inside mobile feeds. Virtual staging lets you
            control that impression long before in-person showings, amplifying
            the impact of resources like{" "}
            <Link href="/home-staging-tips" className="text-primary underline">
              home staging tips
            </Link>{" "}
            and{" "}
            <Link href="/selling-tips" className="text-primary underline">
              seller prep checklists
            </Link>
            .
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <article className="rounded-2xl border border-border p-6">
            <h3 className="text-xl font-semibold">
              Market data: staged visuals lift CTR and DOM
            </h3>
            <p className="mt-3 text-muted-foreground">
              Listings that showcase staged rooms see up to 2× photo engagement
              and routinely shave a full week off days-on-market. Our internal
              benchmarking shows MLS feeds rewarding complete galleries with
              higher placement.
            </p>
          </article>
          <article className="rounded-2xl border border-border p-6">
            <h3 className="text-xl font-semibold">
              Agent + investor pain points solved
            </h3>
            <p className="mt-3 text-muted-foreground">
              Budget ceilings, short lead times, and MLS disclosure rules used to
              make full staging unrealistic. Virtual staging sidesteps storage,
              install crew waitlists, and compliance redlines—especially when
              compared in our{" "}
              <Link href="/virtual-vs-traditional" className="text-primary underline">
                virtual vs. traditional guide
              </Link>
              .
            </p>
          </article>
        </div>
      </section>

      <section className="space-y-8">
        <h2 className="text-3xl font-semibold">How HomeStage Pro Delivers Studio-Grade Results</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <article className="rounded-2xl border border-border p-6">
            <h3 className="text-lg font-semibold">Intake workflow</h3>
            <p className="mt-3 text-muted-foreground">
              Upload rooms, flag architectural quirks, and pick target aesthetics
              through a guided quiz. Our system checks photo specs and prompts
              you with quick references to{" "}
              <Link href="/real-estate-photos" className="text-primary underline">
                real estate photo best practices
              </Link>
              .
            </p>
          </article>
          <article className="rounded-2xl border border-border p-6">
            <h3 className="text-lg font-semibold">AI + designer QA</h3>
            <p className="mt-3 text-muted-foreground">
              Each render blends AI ideation with human retouching for lighting,
              reflections, scale, and MLS-safe annotations. Expect consistent
              output even across bulk projects.
            </p>
          </article>
          <article className="rounded-2xl border border-border p-6">
            <h3 className="text-lg font-semibold">Differentiators vs DIY</h3>
            <p className="mt-3 text-muted-foreground">
              Unlike templated apps, we respect window glare, flooring textures,
              and safety zones. The result is buyer-ready scenes that align with
              premium photography standards.
            </p>
          </article>
        </div>
      </section>

      <section className="space-y-10">
        <h2 className="text-3xl font-semibold">Packages, Turnaround, and ROI Signals</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {packages.map((plan) => (
            <article key={plan.name} className="flex flex-col rounded-2xl border border-border p-6 shadow-sm">
              <h3 className="text-xl font-semibold">{plan.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{plan.tagline}</p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {plan.highlights.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Button asChild variant="outline" size="sm">
                  <Link href="/sales">See plan details</Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <article className="rounded-2xl border border-dashed border-primary/60 bg-primary/5 p-6">
            <h3 className="text-xl font-semibold">Timeline expectations</h3>
            <p className="mt-3 text-muted-foreground">
              Standard delivery lands in 24–48 hours, with Portfolio clients
              unlocking same-day rush add-ons during peak season. You&apos;ll see
              progress updates inside the order tracker.
            </p>
          </article>
          <article className="rounded-2xl border border-dashed border-primary/60 bg-primary/5 p-6">
            <h3 className="text-xl font-semibold">ROI talking points</h3>
            <p className="mt-3 text-muted-foreground">
              Agents leverage staged visuals to justify pricing strategies,
              investors document resale-ready finishes, and STR hosts boost ADR
              by aligning interior stories with audience intent.
            </p>
          </article>
        </div>
      </section>

      <section className="rounded-3xl border border-primary/40 bg-primary/10 px-6 py-10 text-center shadow-lg">
        <p className="text-sm uppercase tracking-[0.4em] text-primary">
          ROI Snapshot
        </p>
        <h3 className="mt-3 text-2xl font-semibold">Need pricing guidance?</h3>
        <p className="mt-2 text-muted-foreground">
          Walk through the same packages we deploy on the{" "}
          <Link href="/sales" className="text-primary underline">
            virtual staging sales page
          </Link>{" "}
          and lock your turnarounds before your next listing goes live.
        </p>
        <div className="mt-6">
          <Button asChild size="lg">
            <Link href="/sales">See Packages & Pricing</Link>
          </Button>
        </div>
      </section>

      <section className="space-y-8">
        <h2 className="text-3xl font-semibold">Proof: Before/After Gallery & Client Wins</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {proofSets.map((set) => (
            <article key={set.title} className="rounded-2xl border border-border p-6">
              <div className="h-40 rounded-lg border border-dashed border-muted-foreground/40 bg-muted/40 p-4 text-center text-sm text-muted-foreground">
                (Insert before/after image here)
              </div>
              <h3 className="mt-4 text-lg font-semibold">{set.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{set.caption}</p>
            </article>
          ))}
        </div>
        <div className="rounded-2xl border border-border p-6">
          <h3 className="text-xl font-semibold">What clients are saying</h3>
          <p className="mt-3 text-muted-foreground">
            “These renders helped me pre-sell a renovation before the contractor
            wrapped the punch list.” — Listing Agent, Austin
          </p>
          <p className="mt-2 text-muted-foreground">
            “Our STR occupancy jumped once we aligned imagery with the local
            lifestyle story.” — STR Operator, Phoenix
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-3xl font-semibold">Implementation Checklist & Next Steps</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <article className="rounded-2xl border border-border p-6">
            <h3 className="text-xl font-semibold">Photo prep guide</h3>
            <p className="mt-3 text-muted-foreground">
              Clear clutter, shoot eye-level, and bracket exposures to capture
              maximum detail—then upload directly from your desktop or mobile
              device.
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>Confirm natural light shots + supporting flash frames.</li>
              <li>Submit empty or lightly furnished rooms for best results.</li>
              <li>Note any fixtures or finishes that must remain.</li>
            </ul>
          </article>
          <article className="rounded-2xl border border-border p-6">
            <h3 className="text-xl font-semibold">Upload & CTA module</h3>
            <p className="mt-3 text-muted-foreground">
              Once assets are ready, head to the sales workspace, choose your
              package, and drop notes for our design leads. We sync with{" "}
              <Link href="/home-staging-tips" className="text-primary underline">
                prep resources
              </Link>{" "}
              and{" "}
              <Link href="/selling-tips" className="text-primary underline">
                seller guidance
              </Link>{" "}
              to keep messaging cohesive.
            </p>
          </article>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-background p-8 text-center shadow-inner">
        <h3 className="text-2xl font-semibold">Ready to showcase photo-perfect rooms?</h3>
        <p className="mt-2 text-muted-foreground">
          Book a consult, align on style boards, and deploy on your next listing
          cycle with confidence.
        </p>
        <div className="mt-6">
          <Button asChild size="lg">
            <Link href="/sales">Book a Virtual Staging Consult</Link>
          </Button>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-3xl font-semibold">FAQ: Virtual Staging for Sellers & Agents</h2>
        <div className="space-y-4">
          {faqs.map((faq) => (
            <article key={faq.question} className="rounded-2xl border border-border p-6">
              <h3 className="text-lg font-semibold">{faq.question}</h3>
              <p className="mt-2 text-muted-foreground">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-muted/40 p-8">
        <h2 className="text-2xl font-semibold">Related resources</h2>
        <p className="mt-2 text-muted-foreground">
          Explore more virtual staging guides, pricing context, and proof assets to round out your pitch materials.
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {filteredResources.map((resource) => (
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

export default VirtualStaging;
