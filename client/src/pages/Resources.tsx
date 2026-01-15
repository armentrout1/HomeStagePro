import { Link } from "wouter";

const sections = [
  {
    title: "Getting Started",
    description: "Kick off virtual staging with the core experience, pricing overview, and gallery proof.",
    links: [
      { href: "/virtual-staging", label: "Virtual Staging Overview" },
      { href: "/sales", label: "Plans & Pricing" },
      { href: "/gallery/", label: "Before & After Gallery" },
    ],
  },
  {
    title: "Use Cases",
    description: "See how different teams apply AI staging workflows across their portfolios.",
    links: [
      { href: "/virtual-staging-for-real-estate-agents", label: "For Real Estate Agents" },
      { href: "/virtual-staging-for-investors", label: "For Investors" },
      { href: "/virtual-staging-for-short-term-rentals", label: "For STR Hosts" },
    ],
  },
  {
    title: "Pricing & ROI",
    description: "Understand cost structures and how staging drives faster conversions.",
    links: [
      { href: "/virtual-staging-cost", label: "Virtual Staging Cost" },
      { href: "/sales", label: "Compare Plan ROI" },
    ],
  },
  {
    title: "Guides",
    description: "Deep dives for prepping listings, photography, and staging strategy.",
    links: [
      { href: "/home-staging-tips", label: "Home Staging Tips" },
      { href: "/real-estate-photos", label: "Real Estate Photos" },
      { href: "/virtual-vs-traditional", label: "Virtual vs Traditional" },
      { href: "/selling-tips", label: "Selling Tips" },
    ],
  },
];

export default function Resources() {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <header className="mb-12 space-y-4 text-center">
          <p className="inline-flex items-center rounded-full bg-amber-50 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
            Knowledge Hub
          </p>
          <h1 className="text-4xl font-semibold text-slate-900">Resources</h1>
          <p className="text-lg text-slate-600">
            Guides, playbooks, and proof to help agents, investors, and short-term rental hosts
            ship polished listings faster.
          </p>
        </header>

        <div className="grid gap-8 md:grid-cols-2">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-3xl border border-slate-100 bg-slate-50/60 p-6 shadow-sm"
            >
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-slate-900">{section.title}</h2>
                <p className="text-sm text-slate-600">{section.description}</p>
              </div>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow transition hover:-translate-y-0.5 hover:bg-amber-50 hover:text-amber-700"
                    >
                      <span>{link.label}</span>
                      <span
                        aria-hidden="true"
                        className="text-slate-300 transition group-hover:text-amber-500"
                      >
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
