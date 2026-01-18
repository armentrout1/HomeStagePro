const sections = [
  {
    title: "Our Mission",
    body:
      "We help every listing look market-ready, even when the property is empty or mid-renovation. RoomStagerPro blends AI staging with human oversight so buyers see the best possible version of a space before they tour it in person.",
  },
  {
    title: "What We Do",
    body:
      "Upload your room photos, choose desired styles, and get polished visuals back fast. Our workflow combines AI concepts, AI-powered staging, and easy downloads so you can share before-and-after proof on MLS, social, or presentations without delays.",
  },
  {
    title: "Who It’s For",
    body:
      "Residential agents, investor teams, short-term rental hosts, and homeowners who need to market a property quickly. If you manage listings or want to show potential, RoomStagerPro streamlines the visual storytelling.",
  },
  {
    title: "Trust & Transparency",
    body:
      "We encourage clear disclosure when using virtually staged imagery. Labeling photos keeps buyers informed and builds confidence in your brand. Our team is available to help you integrate the required language into your marketing assets.",
  },
];

export default function About() {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <header className="mb-12 space-y-4 text-center">
          <p className="inline-flex items-center rounded-full bg-amber-50 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
            RoomStagerPro
          </p>
          <h1 className="text-4xl font-semibold text-slate-900">About RoomStagerPro</h1>
          <p className="text-lg text-slate-600">
            We’re a Kansas City-based team building AI-assisted staging workflows that unlock faster listing prep and stronger buyer engagement.
          </p>
        </header>

        <div className="space-y-10 text-slate-700">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-2xl font-semibold text-slate-900">{section.title}</h2>
              <p className="mt-3">{section.body}</p>
            </section>
          ))}

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">Contact</h2>
            <p className="mt-3">
              Want to collaborate or have questions? Reach out at {" "}
              <a
                href="mailto:contact@roomstagerpro.com"
                className="text-amber-600 hover:text-amber-700"
              >
                contact@roomstagerpro.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
