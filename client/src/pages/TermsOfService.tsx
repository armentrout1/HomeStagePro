const sections = {
  agreement: [
    "By accessing RoomStagerPro you agree to these Terms and to our Privacy Policy.",
    "If you use the service on behalf of an organization, you represent that you have authority to bind that entity.",
  ],
  eligibility: [
    "You must be at least 18 years old and able to form a binding contract.",
    "You may not use the service if you have been previously suspended or banned.",
  ],
  accounts: [
    "Maintain accurate account information and safeguard your login credentials.",
    "You are responsible for all activity that occurs under your account, including actions by teammates or delegates.",
  ],
  acceptableUse: [
    "Do not upload unlawful, infringing, or offensive content.",
    "Do not interfere with, disrupt, or probe the platform, infrastructure, or security measures.",
    "Do not attempt to reverse engineer, copy, or resell the service without permission.",
  ],
  userContent: [
    "You retain ownership of images and instructions you upload.",
    "You grant RoomStagerPro the rights needed to process, host, and display that content within the product.",
    "You are responsible for securing rights and consents for any third-party materials included in uploads.",
  ],
  payments: [
    "Paid plans, credits, and add-ons are billed in accordance with the selection made in-app.",
    "Fees are non-refundable except where required by law or expressly stated in writing.",
    "We may update plan pricing or features with reasonable notice.",
  ],
  intellectualProperty: [
    "RoomStagerPro owns the platform, designs, software, and generated staging experiences, subject to user uploads.",
    "You may not remove branding, attempt to copy proprietary models, or claim ownership of the service.",
  ],
  disclaimers: [
    "The service is provided \"as-is\" without warranties of merchantability, fitness for a particular purpose, or non-infringement.",
    "We do not guarantee specific listing outcomes, buyer responses, or rendering timelines.",
  ],
  liability: [
    "RoomStagerPro's total liability for any claim is limited to the amount paid for the service in the twelve months preceding the event.",
    "We are not liable for indirect, consequential, or incidental damages arising from use of the service.",
  ],
  termination: [
    "We may suspend or terminate accounts that violate these Terms or pose risk to the service.",
    "You may close your account at any time, but fees already paid remain due.",
  ],
  changes: [
    "We may update these Terms from time to time.",
    "If changes are material, we will provide notice by email or in-product messaging before they take effect.",
  ],
};

export default function TermsOfService() {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <header className="mb-12 space-y-4 text-center">
          <p className="inline-flex items-center rounded-full bg-amber-50 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
            Policy Center
          </p>
          <h1 className="text-4xl font-semibold text-slate-900">Terms of Service</h1>
          <p className="text-lg text-slate-600">
            These Terms explain the rules for accessing RoomStagerPro's virtual staging tools. Please read them carefully before using the platform.
          </p>
        </header>

        <div className="space-y-10 text-slate-700">
          <section>
            <h2 className="text-2xl font-semibold text-slate-900">Agreement to Terms</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              {sections.agreement.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">Eligibility</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              {sections.eligibility.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">Accounts &amp; Access</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              {sections.accounts.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">Acceptable Use</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              {sections.acceptableUse.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">User Content &amp; Uploaded Images</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              {sections.userContent.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">Payments, Plans &amp; Refunds</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              {sections.payments.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">Intellectual Property</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              {sections.intellectualProperty.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">Disclaimers</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              {sections.disclaimers.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">Limitation of Liability</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              {sections.liability.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">Termination</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              {sections.termination.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">Changes to Terms</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              {sections.changes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">Contact Us</h2>
            <p className="mt-3">
              Questions about these Terms? Email us at{' '}
              <a href="mailto:contact@roomstagerpro.com" className="text-amber-600 hover:text-amber-700">
                contact@roomstagerpro.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">Effective Date</h2>
            <p className="mt-3">These Terms are effective as of January 17, 2026.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
