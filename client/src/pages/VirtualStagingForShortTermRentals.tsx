import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const faq = [
  {
    question: "How quickly can I get my short-term rental virtually staged?",
    answer:
      "Standard STR virtual staging projects are completed within 24-48 hours, with express options for hosts facing last-minute bookings or OTA refresh deadlines.",
  },
  {
    question: "Will virtual staging help me charge higher rates for my Airbnb?",
    answer:
      "Professionally staged listings see 20-40% gains in nightly rates and occupancy. Guests instantly understand the lifestyle you are selling and are willing to pay for the perceived value.",
  },
  {
    question: "Can you stage rooms that are currently empty or under construction?",
    answer:
      "Yes. Upload clean progress photos and we will add realistic furniture, decor, and lighting cues so travelers visualize the final experience before you turn the space.",
  },
  {
    question: "How do you keep staged rooms aligned with real amenities?",
    answer:
      "Every project starts with a discovery call so renders match your actual finishes and amenities. We reference your brand guide, amenity list, and booking persona to avoid misrepresentation.",
  },
  {
    question: "What if I need different looks for seasons or target guests?",
    answer:
      "Order multiple style presets—winter hygge, summer coastal, digital nomad workspaces—and rotate them with your seasonal pricing strategy to keep listings fresh.",
  },
  {
    question: "Do the renders comply with Airbnb and VRBO rules?",
    answer:
      "Absolutely. We add subtle overlays and provide caption language that keeps you compliant with Airbnb, VRBO, and Booking.com disclosure policies.",
  },
];

const VirtualStagingForShortTermRentals = () => {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-16 px-4 py-16">
      <header className="space-y-5">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Use Case · Short-Term Rentals
        </p>
        <h1 className="text-4xl font-semibold">
          Virtual Staging for Short-Term Rentals (Airbnb/VRBO)
        </h1>
        <p className="text-lg text-muted-foreground">
          Convert more bookings by merchandising every space with AI-powered staging
          tuned for Airbnb, VRBO, and boutique vacation rental platforms. Show guests
          the complete stay—from cozy living zones to productive work areas—before
          they ever land on your doorstep.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/sales">See STR Packages</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/gallery/">View Examples</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/">Try AI Stager</Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Launch the full STR playbook soon—this live page will keep expanding with
          fresh proof points, packages, and host resources.
        </p>
      </header>

      <section className="space-y-8">
        <h2 className="text-3xl font-semibold">
          Why Virtual Staging is Essential for Short-Term Rentals
        </h2>
        <div className="space-y-6 text-muted-foreground">
          <div>
            <h3 className="text-2xl font-semibold text-foreground">
              The Competitive Advantage of Staged STR Properties
            </h3>
            <p>
              Staged listings outperform blank rooms because travelers shop with
              their imagination. By merchandising every corner with curated
              furniture, props, and lighting, you highlight usable zones (reading
              nooks, WFH desks, kid-friendly bunks) that boost occupancy and repeat
              stays. Lifestyle visuals also help your listing climb OTA search
              results as guests spend more time engaging with photos.
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-foreground">
              ROI of Virtual Staging for Airbnb Hosts
            </h3>
            <p>
              Compared to the cost of physical installs, AI staging delivers a
              faster break-even. Hosts routinely see 40% lifts in booking inquiries
              after refreshing their gallery. Pair this guide with the pricing
              breakdown at{" "}
              <Link href="/virtual-staging-cost" className="text-primary underline">
                /virtual-staging-cost
              </Link>{" "}
              and the services overview at{" "}
              <Link href="/virtual-staging" className="text-primary underline">
                /virtual-staging
              </Link>{" "}
              to show owners the full financial picture.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <h2 className="text-3xl font-semibold">
          Virtual Staging Solutions for Different Property Types
        </h2>
        <div className="space-y-6 text-muted-foreground">
          <div>
            <h3 className="text-2xl font-semibold text-foreground">
              Entire Home Staging Strategies
            </h3>
            <p>
              Showcase every room from the moment a traveler opens your listing.
              Style the hero photo with an inviting living room vignette, add family
              dining scenes, and merchandise bedrooms with layered textiles that
              tease comfort and adequate storage. Kitchens and bathrooms get subtle
              upgrades—artisan coffee setups, spa towel stacks, and thoughtful
              lighting edits that telegraph cleanliness.
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-foreground">
              Private Room and Shared Space Staging
            </h3>
            <p>
              Hosts offering private rooms or coliving suites need to convey both
              privacy and community. Use staging to define personal workstations,
              blackout drapery, and lockable storage while highlighting stylish
              shared kitchens and lounges. Balanced layouts reassure guests that
              comfort and capacity coexist.
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-foreground">
              Specialty Property Staging
            </h3>
            <p>
              Luxury villas demand layered art direction, while tiny homes benefit
              from multifunctional furniture that underscores efficient square
              footage. No matter the niche—glamping sites, ski condos, urban
              lofts—our team builds presets that align with your brand voice and
              audience expectations.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <h2 className="text-3xl font-semibold">
          Technical Requirements for STR Virtual Staging
        </h2>
        <div className="space-y-6 text-muted-foreground">
          <div>
            <h3 className="text-2xl font-semibold text-foreground">
              Photography Best Practices for Virtual Staging
            </h3>
            <p>
              Crisp inputs equal premium outputs. Follow the lighting and angle tips
              from{" "}
              <Link href="/real-estate-photos" className="text-primary underline">
                /real-estate-photos
              </Link>{" "}
              to ensure every RAW file captures ceiling height, window placement,
              and power outlets. Declutter surfaces, hide cords, and shoot wide
              enough to leave room for furniture compositing.
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-foreground">
              Platform-Specific Staging Guidelines
            </h3>
            <p>
              Airbnb prefers clean, bright imagery while VRBO highlights amenity
              closeups. Booking.com requires disclosures similar to MLS boards. Use
              this guide alongside the comparison at{" "}
              <Link
                href="/virtual-vs-traditional"
                className="text-primary underline"
              >
                /virtual-vs-traditional
              </Link>{" "}
              so owners understand how digital staging stays compliant while beating
              traditional installs on speed.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <h2 className="text-3xl font-semibold">
          Maximizing Your STR Investment with Virtual Staging
        </h2>
        <div className="space-y-6 text-muted-foreground">
          <div>
            <h3 className="text-2xl font-semibold text-foreground">
              Seasonal Staging Strategies
            </h3>
            <p>
              Rotate visuals to match traveler intent. Think cozy throws and warm
              lighting for winter ski weekends, breezy fabrics for coastal summers,
              and greenery plus hydration stations for festival traffic. These quick
              refreshes keep OTA thumbnails current and increase click-through as
              guests search by season.
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-foreground">
              Pricing Strategy Integration
            </h3>
            <p>
              Use staged galleries to justify premium ADRs and to test dynamic
              pricing. Pair before/after sets with your revenue data and share them
              in owner updates or the pricing deck at{" "}
              <Link href="/sales" className="text-primary underline">
                /sales
              </Link>
              . When travelers see aspirational visuals, they accept higher nightly
              rates and longer minimum stays.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <h2 className="text-3xl font-semibold">
          Common Mistakes to Avoid in STR Virtual Staging
        </h2>
        <div className="space-y-6 text-muted-foreground">
          <div>
            <h3 className="text-2xl font-semibold text-foreground">
              Overcrowding and Space Misrepresentation
            </h3>
            <p>
              Adding too many pieces makes small footprints feel cramped and can
              invite poor reviews. We keep scale accurate, use realistic shadows, and
              provide disclosure language so no guest feels misled when they arrive.
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-foreground">
              Inconsistent Branding Across Listings
            </h3>
            <p>
              Operators running across multiple markets need cohesive styling. We
              maintain palette, props, and typography cues so your entire portfolio
              feels intentional whether guests discover you via social ads or the
              main site at{" "}
              <Link href="/virtual-staging" className="text-primary underline">
                /virtual-staging
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border p-6">
        <h2 className="text-3xl font-semibold">Proof That Styled STRs Convert</h2>
        <p className="mt-3 text-muted-foreground">
          Hosts who refreshed their listings with 20 staged photos saw 12% occupancy
          gains and $31 ADR lifts within 30 days. Browse the before/after gallery at{" "}
          <Link href="/gallery/" className="text-primary underline">
            /gallery/
          </Link>{" "}
          to pull comps for your next owner update or lending package.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-3xl font-semibold">FAQ: STR Operators</h2>
        <div className="space-y-4">
          {faq.map((item) => (
            <div key={item.question} className="rounded-2xl border p-5">
              <h3 className="text-xl font-semibold">{item.question}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border bg-muted/40 p-6">
        <h2 className="text-2xl font-semibold">Ready to Stage Your STR?</h2>
        <p className="mt-2 text-muted-foreground">
          Tap into rapid turnarounds, OTA-friendly disclosures, and seasonal refresh
          packages built for occupancy growth. Use the AI uploader now and hand off
          the rest to our staging team.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/sales">See STR Packages</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/gallery/">View Examples</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/">Try AI Stager</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default VirtualStagingForShortTermRentals;
