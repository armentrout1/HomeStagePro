const supportAreas = [
  "Billing and plan upgrades",
  "Staging workflow and AI render questions",
  "Partnerships and custom deployments",
];

export default function Contact() {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <header className="mb-12 space-y-4 text-center">
          <p className="inline-flex items-center rounded-full bg-amber-50 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
            Support
          </p>
          <h1 className="text-4xl font-semibold text-slate-900">Contact</h1>
          <p className="text-lg text-slate-600">
            Reach out when you need help with RoomStagerPro. We respond to most requests within 1–2 business days.
          </p>
        </header>

        <div className="space-y-10 text-slate-700">
          <section>
            <h2 className="text-2xl font-semibold text-slate-900">Email</h2>
            <p className="mt-3">
              Send us a note at{" "}
              <a
                href="mailto:aaron@aprkc.com"
                className="font-semibold text-amber-600 hover:text-amber-700"
              >
                info@roomstagerpro.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">How We Can Help</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              {supportAreas.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">Phone</h2>
            <p className="mt-3">
              Prefer to talk it through? Call us at{" "}
              <a href="tel:+18167287548" className="font-semibold text-amber-600 hover:text-amber-700">
                (816) 728-7548
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">Response Time</h2>
            <p className="mt-3">
              Our support inbox is monitored Monday through Friday. Expect a reply within 1–2 business days.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
