import { Link } from "wouter";

const whyItWorks = [
  "Priced for every listing — buy credits only when you need them.",
  "Secure cookie-based access means no user accounts to manage.",
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
    price: "$9",
    blurb: "5 stagings that cover living, kitchen, and a bedroom marketing set.",
    note: "One-time pack. No subscription.",
  },
  {
    name: "Value Pack",
    price: "$25",
    blurb: "20 stagings for active sellers who need fast refreshes.",
    note: "Bulk savings with flexible usage.",
  },
  {
    name: "Pro Monthly",
    price: "$49",
    blurb: "50 stagings that refill every month for busy teams.",
    note: "Great for ongoing listing pipelines.",
  },
];

const faqs = [
  {
    question: "How do I get started?",
    answer:
      "Purchase a credit pack, then launch the AI uploader. Credits are stored in a secure cookie so the tool recognizes your access instantly.",
  },
  {
    question: "Do I need an account?",
    answer:
      "No usernames or passwords. Paid tokens give you access without managing logins.",
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
            Self-Serve Packs
          </p>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold text-slate-900">Affordable AI Virtual Staging</h1>
            <p className="text-lg text-slate-600">
              Purchase a small pack to test the workflow or scale up for active campaigns. Every credit unlocks a high-quality render in minutes.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/sales"
              className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Choose a Pack
            </Link>
            <Link
              href="/#ai-stager"
              className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-900 hover:border-slate-300"
            >
              Launch AI Stager
            </Link>
          </div>
          <p className="text-sm text-slate-500">
            Credits start at $9 for 5 stagings · Instant download · Fast results (usually within a few minutes)
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
          <p className="text-center text-base text-slate-600 mb-6">
            When you're ready to move forward, view all affordable virtual staging plans and pricing.
          </p>
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
