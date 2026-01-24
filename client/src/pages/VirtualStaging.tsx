import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Quick Pack",
    price: "$9",
    description: "5 stagings to use anytime",
    bullets: [
      "High-quality AI exports",
      "Instant downloads as soon as rendering finishes",
      "Works for living, bedroom, dining, kitchen, and flex rooms",
    ],
  },
  {
    name: "Value Pack",
    price: "$25",
    description: "20 stagings for active sellers",
    bullets: [
      "Same fast AI workflow",
      "Use credits whenever you need them",
      "Great for agents refreshing multiple listings",
    ],
  },
  {
    name: "Pro Monthly",
    price: "$49",
    description: "50 stagings that refill each month",
    bullets: [
      "Predictable budget for teams",
      "Track usage inside the uploader",
      "Covers all supported room types",
    ],
  },
];

const faqs = [
  {
    question: "How long do renders take?",
    answer:
      "Most rooms finish within a few minutes. If something looks off, you can simply rerun the request with another credit.",
  },
  {
    question: "Do images include MLS disclosures automatically?",
    answer:
      "Downloaded files are unedited, so add your local \"virtually staged\" overlay or caption before uploading to the MLS.",
  },
  {
    question: "What photo quality works best?",
    answer:
      "Shoot clutter-free rooms with even lighting. Phone photos are fine as long as you capture the full space and keep the camera level.",
  },
  {
    question: "Can I choose specific furniture styles?",
    answer:
      "The current MVP supports room-type selection (living, bedroom, dining, kitchen, flex). Style presets are on the roadmap, so feel free to note requests when you upload.",
  },
  {
    question: "Do I need an account to try it?",
    answer:
      "No. You get two free stagings with no login required. Paid packs unlock more credits and high-res downloads when you're ready.",
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

const VirtualStaging = () => {
  const filteredResources = relatedResources.filter(
    (resource) => resource.href !== "/virtual-staging",
  );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-16 px-4 py-16">
      <section className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-14 text-white shadow-2xl">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Self-Serve Tool</p>
        <h1 className="mt-4 text-4xl font-semibold">Virtual Staging Powered by Instant AI</h1>
        <p className="mt-4 max-w-3xl text-lg text-slate-200">
          Upload an empty room, select the room type, and download a staged version—usually within a few minutes. No phone calls, no waiting list, just quick visuals you can review and rerun as needed.
        </p>
        <p className="mt-2 text-sm text-slate-300">
          To compare plans, pricing, and purchase options, see our virtual staging plans.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <div className="rounded-xl border border-white/20 px-4 py-3 text-sm text-slate-200">
            2 free stagings · no login required
          </div>
          <div className="rounded-xl border border-white/20 px-4 py-3 text-sm text-slate-200">
            Paid packs unlock high-res downloads
          </div>
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild size="lg" className="bg-white text-slate-900 hover:bg-slate-100">
            <Link href="/#ai-stager">Try 2 Free Stagings</Link>
          </Button>
          <Button asChild size="lg" variant="secondary" className="text-white border-white/40">
            <Link href="/sales">See Paid Plans</Link>
          </Button>
        </div>
      </section>

      <section className="space-y-8">
        <div>
          <h2 className="text-3xl font-semibold">Why agents and owners lean on the AI stager</h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Virtual staging lets you preview a marketing-ready room without renting furniture. Use it alongside resources like{" "}
            <Link href="/home-staging-tips" className="text-primary underline">
              home staging tips
            </Link>{" "}
            and{" "}
            <Link href="/selling-tips" className="text-primary underline">
              seller prep checklists
            </Link>{" "}
            to show every space at its best.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <article className="rounded-2xl border border-border p-6">
            <h3 className="text-xl font-semibold">Keep your pipeline moving</h3>
            <p className="mt-3 text-muted-foreground">
              Snap a clean photo, upload it, and let the AI handle staging while you focus on pricing, disclosures, and showings. If you need a new variation, re-run the room with another credit—no ticket queue necessary.
            </p>
          </article>
          <article className="rounded-2xl border border-border p-6">
            <h3 className="text-xl font-semibold">Easy handoff to your MLS workflow</h3>
            <p className="mt-3 text-muted-foreground">
              Downloads are untouched JPG/PNG files, so you can add your own “virtually staged” overlay or caption before uploading to listing portals.
            </p>
          </article>
        </div>
      </section>

      <section className="space-y-8">
        <h2 className="text-3xl font-semibold">How the current MVP works</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <article className="rounded-2xl border border-border p-6">
            <h3 className="text-lg font-semibold">1. Upload a photo</h3>
            <p className="mt-3 text-muted-foreground">
              Use clutter-free photos shot at eye level. The uploader walks you through the basics and flags if a file looks too dark or skewed.
            </p>
          </article>
          <article className="rounded-2xl border border-border p-6">
            <h3 className="text-lg font-semibold">2. Pick the room type</h3>
            <p className="mt-3 text-muted-foreground">
              Choose living room, bedroom, dining, kitchen, or flex/office. Style presets aren’t available yet, but you can note inspiration in the description.
            </p>
          </article>
          <article className="rounded-2xl border border-border p-6">
            <h3 className="text-lg font-semibold">3. Download & repeat</h3>
            <p className="mt-3 text-muted-foreground">
              Renders usually finish within a few minutes. Save the image, add any disclosures required by your MLS, and re-run if you want another look.
            </p>
          </article>
        </div>
      </section>

      <section className="space-y-8">
        <h2 className="text-3xl font-semibold">Plans & credits</h2>
        <p className="text-muted-foreground">
          Start with two free stagings (no login). When you need more credits or higher resolutions, choose the pack that fits your pipeline.
        </p>
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.name} className="flex flex-col rounded-2xl border border-border p-6 shadow-sm">
              <h3 className="text-xl font-semibold">{plan.name}</h3>
              <p className="mt-2 text-3xl font-bold">{plan.price}</p>
              <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {plan.bullets.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Button asChild variant="outline" size="sm">
                  <Link href="/upgrade">Get this pack</Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-background p-8 text-center shadow-inner">
        <h3 className="text-2xl font-semibold">Ready to see your room staged?</h3>
        <p className="mt-2 text-muted-foreground">
          Launch the uploader, drop in a photo, and watch the AI version generate. Re-run rooms anytime by spending another credit.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/#ai-stager">Try 2 Free Stagings</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/sales">Talk about packs</Link>
          </Button>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-3xl font-semibold">FAQ</h2>
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
