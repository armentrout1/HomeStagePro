export type RouteSeo = {
  title: string;
  description: string;
  canonicalPath: string;
  robots?: string;
  ogImage?: string;
};

export const SITE_ORIGIN = "https://roomstagerpro.com";

export const ROUTE_SEO: Record<string, RouteSeo> = {
  "/": {
    title: "RoomStagerPro - AI-Powered Virtual Room Staging",
    description:
      "Transform empty rooms into beautifully staged spaces in seconds using RoomStagerPro's AI virtual staging platform.",
    canonicalPath: "/",
    ogImage: "/images/meta-preview.png",
  },
  "/home-staging-tips": {
    title: "Home Staging Tips | RoomStagerPro",
    description:
      "Discover expert home staging tips to help properties stand out and sell faster with RoomStagerPro.",
    canonicalPath: "/home-staging-tips",
    ogImage: "/images/meta-preview.png",
  },
  "/real-estate-photos": {
    title: "Real Estate Photo Guide | RoomStagerPro",
    description:
      "Learn how professional real estate photos and AI staging boost buyer interest and listing performance.",
    canonicalPath: "/real-estate-photos",
    ogImage: "/images/meta-preview.png",
  },
  "/virtual-vs-traditional": {
    title: "Virtual vs Traditional Staging | RoomStagerPro",
    description:
      "Compare virtual and traditional staging approaches to choose the right method for your listings.",
    canonicalPath: "/virtual-vs-traditional",
    ogImage: "/images/meta-preview.png",
  },
  "/virtual-staging": {
    title: "Virtual Staging Services | HomeStage Pro",
    description:
      "Modernize listings fast with AI virtual staging, before/after proof, and transparent packages from HomeStage Pro. Book a consult in minutes.",
    canonicalPath: "/virtual-staging",
    ogImage: "/images/meta-preview.png",
  },
  "/selling-tips": {
    title: "Home Selling Tips | RoomStagerPro",
    description:
      "Get actionable tips for selling homes faster, from curb appeal ideas to AI-powered staging strategies.",
    canonicalPath: "/selling-tips",
    ogImage: "/images/meta-preview.png",
  },
  "/sales": {
    title: "RoomStagerPro Sales | Plans & Pricing",
    description:
      "Explore virtual staging plans built for agents and property teams, including free and premium options.",
    canonicalPath: "/sales",
    ogImage: "/images/meta-preview.png",
  },
  "/upgrade": {
    title: "Upgrade Your RoomStagerPro Plan",
    description:
      "Unlock premium staging credits and higher quality renders by upgrading your RoomStagerPro plan.",
    canonicalPath: "/upgrade",
    robots: "noindex,nofollow",
    ogImage: "/images/meta-preview.png",
  },
  "/thank-you": {
    title: "Thank You | RoomStagerPro",
    description:
      "Your RoomStagerPro purchase is complete. Access your upgraded staging credits and start designing.",
    canonicalPath: "/thank-you",
    robots: "noindex,nofollow",
    ogImage: "/images/meta-preview.png",
  },
};
