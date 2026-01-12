import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const galleryItems = [
  {
    id: "living-1",
    title: "Modern living room reset",
    beforeSrc: "/gallery/living-1-before.webp",
    afterSrc: "/gallery/living-1-after.jpg",
    description:
      "Vacant condo space transformed with layered neutrals, sculptural lighting, and art direction that lifts perceived value.",
  },
  {
    id: "bed-1",
    title: "Primary bedroom retreat",
    beforeSrc: "/gallery/bed-1-before.webp",
    afterSrc: "/gallery/bed-1-after.jpg",
    description:
      "Muted staging palette introduces warmth, textured bedding, and accent lighting to inspire move-in imagination.",
  },
];

const Gallery = () => {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-16">
      <section className="text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-primary">Proof Library</p>
        <h1 className="mt-4 text-4xl font-semibold">Before &amp; After Virtual Staging Examples</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Explore how AI-assisted staging elevates raw listing photos into polished marketing assets.
          Every pair below uses the exact workflow available inside the RoomStager Pro app.
        </p>
      </section>

      <div className="grid gap-8">
        {galleryItems.map((item) => (
          <article
            key={item.id}
            className="rounded-3xl border border-border bg-background/60 shadow-md md:grid md:grid-cols-2"
          >
            <div className="space-y-4 border-b border-dashed border-border/50 p-8 md:border-b-0 md:border-r">
              <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Before</p>
              <div className="overflow-hidden rounded-2xl bg-muted">
                <img
                  src={item.beforeSrc}
                  alt={`${item.title} before virtual staging`}
                  className="w-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
            <div className="flex flex-col justify-between gap-6 p-8">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-primary">After</p>
                <div className="mt-4 overflow-hidden rounded-2xl">
                  <img
                    src={item.afterSrc}
                    alt={`${item.title} after virtual staging`}
                    className="w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="mt-6 space-y-3">
                  <h2 className="text-2xl font-semibold">{item.title}</h2>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="flex flex-col items-center gap-4 rounded-3xl border border-primary/40 bg-primary/5 p-8 text-center md:flex-row md:justify-between md:text-left">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-primary">Ready to test?</p>
          <h3 className="mt-2 text-2xl font-semibold">Spin up your own before &amp; after set</h3>
          <p className="mt-2 text-muted-foreground">
            Start staging new rooms in minutes or head to pricing to secure bulk credits for upcoming listings.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" variant="secondary">
            <Link href="/">Try AI Stager</Link>
          </Button>
          <Button asChild size="lg">
            <Link href="/sales">See Packages &amp; Pricing</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Gallery;
