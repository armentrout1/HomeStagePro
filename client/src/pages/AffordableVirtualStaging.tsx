import { Link } from "wouter";

const whyItWorks = [
  "Priced for every listing — pay only when you need it.",
  "No login or account setup required for the free stagings.",
  "Fast AI rendering so you aren't waiting on designers.",
  "Instant downloads in high-resolution formats.",
  "Simple guided steps anyone on your team can follow.",
];

const howItWorks = [
  {
    title: "1. Upload",
    description: "Drop in a photo of any empty or outdated room you want to refresh.",
  },
  {
    title: "2. Select style",
    description: "Choose the room type and vibe — we handle the layout and decor.",
  },
  {
    title: "3. Download",
    description: "Preview, make another variation if needed, then download instantly.",
  },
];

const pricing = [
  {
    name: "Quick Pack",
    price: "2 free",
    blurb: "Perfect for testing the workflow or staging a single highlight room.",
    note: "No credit card required.",
  },
  {
    name: "Value Pack",
    price: "$9",
    blurb: "5 stagings that cover living, kitchen, and a bedroom marketing set.",
    note: "One-time pack. No subscription.",
  },
  {
    name: "Pro Monthly",
    price: "$25",
    blurb: "20 stagings for busy agents who refresh multiple listings weekly.",
    note: "Add-on option: $49 for 50.",
  },
];

const faqs = [
  {
    question: "Is it really free?",
    answer:
      "Yes. You get two complimentary stagings with instant downloads to try the tool before paying anything.",
  },
  {
    question: "Do I need an account?",
    answer:
      "No login is required for the free stagings or credit-pack purchases. Sign up only if you want ongoing tracking.",
  },
  {
    question: "How fast is it?",
    answer:
      "Most renders are ready within a few minutes. You'll see status updates and can download as soon as it's complete.",
  },
];

export default function AffordableVirtualStaging() {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <header className="mb-14 space-y-5 text-center">
          <p className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Intro Offer
          </p>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold text-slate-900">Affordable AI Virtual Staging</h1>
            <p className="text-lg text-slate-600">
              Get 2 free stagings with no login, then pick up 5 for $9 packs when you need more.
              Fast, download-ready results built for Google Ads visitors who want proof first.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/#ai-stager"
              className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Try 2 Free Stagings
            </Link>
            <Link
              href="/sales"
              className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-900 hover:border-slate-300"
            >
              View Plans
            </Link>
          </div>
          <p className="text-sm text-slate-500">
            2 free stagings — no login required · 5 for $9 packs · Instant download · Fast results (usually within a few minutes)
          </p>
        </header>

        <section className="mb-16">
          <h2 className="text-center text-2xl font-semibold text-slate-900">Why it works</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {whyItWorks.map((item) => (
              <div key={item} className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm text-slate-700">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-center text-2xl font-semibold text-slate-900">How it works</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {howItWorks.map((step) => (
              <div key={step.title} className="rounded-2xl border border-slate-100 px-5 py-6 text-center shadow-sm">
                <p className="text-base font-semibold text-slate-900">{step.title}</p>
                <p className="mt-3 text-sm text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-center text-2xl font-semibold text-slate-900">Pricing packs</h2>
          <p className="mt-3 text-center text-sm text-slate-500">No subscription required. Just grab the credits you need.</p>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {pricing.map((option) => (
              <div key={option.name} className="rounded-2xl border border-slate-100 bg-white px-6 py-6 shadow">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">{option.name}</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{option.price}</p>
                <p className="mt-3 text-sm text-slate-600">{option.blurb}</p>
                <p className="mt-4 text-xs font-medium text-slate-500">{option.note}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-center text-2xl font-semibold text-slate-900">FAQ</h2>
          <div className="mt-8 space-y-6">
            {faqs.map((faq) => (
              <div key={faq.question} className="rounded-2xl border border-slate-100 px-6 py-5">
                <p className="text-base font-semibold text-slate-900">{faq.question}</p>
                <p className="mt-2 text-sm text-slate-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
