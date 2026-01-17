const dataPoints = {
  informationCollected: [
    "Account details you provide, such as name, email, and organization.",
    "Property data, images, and project notes uploaded to the platform.",
    "Usage information including device type, browser, and feature interactions.",
    "Transactional details related to plan selections or purchases (processed securely by our payment partners).",
  ],
  usageReasons: [
    "Operate, maintain, and improve the RoomStagerPro experience.",
    "Provide customer support, respond to inquiries, and deliver updates.",
    "Personalize content, recommendations, and onboarding guidance.",
    "Analyze aggregate usage trends to plan new features and safeguard the service.",
  ],
  sharingContexts: [
    "Vetted service providers that support hosting, analytics, payments, or customer communications.",
    "Professional advisors or legal authorities when required to comply with law or protect our rights.",
    "Business transfers, if RoomStagerPro is involved in a merger, acquisition, or asset sale.",
  ],
  retentionPractices: [
    "Account data is retained while you maintain an active relationship with RoomStagerPro.",
    "Project files and uploads can be deleted by you at any time from within the product.",
    "We may retain limited records as required for legal, tax, or security purposes.",
  ],
  securityPractices: [
    "Encrypted transport (HTTPS) for data in transit.",
    "Access controls limiting staff permissions to only what is necessary.",
    "Monitoring and review of systems for potential vulnerabilities.",
  ],
  choices: [
    "Update or correct your profile information within your account settings.",
    "Opt out of marketing emails by using the unsubscribe link or contacting us directly.",
    "Disable cookies in your browser, understanding that certain features may be limited.",
  ],
};

export default function PrivacyPolicy() {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <header className="mb-12 space-y-4 text-center">
          <p className="inline-flex items-center rounded-full bg-amber-50 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
            Policy Center
          </p>
          <h1 className="text-4xl font-semibold text-slate-900">Privacy Policy</h1>
          <p className="text-lg text-slate-600">
            This Privacy Policy explains how RoomStagerPro collects, uses, and safeguards your
            information when you access our website and virtual staging services.
          </p>
        </header>

        <div className="space-y-10 text-slate-700">
          <section>
            <h2 className="text-2xl font-semibold text-slate-900">Overview</h2>
            <p className="mt-3">
              RoomStagerPro provides AI-enabled staging tools to creatives, agents, and real estate
              teams. We collect only the information needed to deliver the product, communicate with
              you, and fulfill legal obligations. This document summarizes our current practices.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">Information We Collect</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              {dataPoints.informationCollected.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">How We Use Information</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              {dataPoints.usageReasons.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">Cookies &amp; Analytics</h2>
            <p className="mt-3">
              We may use cookies or similar technologies to remember preferences, maintain session
              security, and understand how visitors interact with RoomStagerPro. You can typically
              adjust browser settings to refuse cookies, though certain features may not function as
              intended without them.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">How We Share Information</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              {dataPoints.sharingContexts.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">Data Retention</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              {dataPoints.retentionPractices.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">Security</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              {dataPoints.securityPractices.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">Your Choices</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              {dataPoints.choices.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">Contact Us</h2>
            <p className="mt-3">
              If you have questions about this Privacy Policy or need to exercise your privacy
              rights, contact us at <a href="mailto:contact@roomstagerpro.com" className="text-amber-600 hover:text-amber-700">contact@roomstagerpro.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">Effective Date</h2>
            <p className="mt-3">This policy is effective as of January 17, 2026.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
