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
    title: "Virtual Staging Services | RoomStagerPro",
    description:
      "Modernize listings fast with AI virtual staging, before/after proof, and transparent packages from RoomStagerPro. Book a consult in minutes.",
    canonicalPath: "/virtual-staging",
    ogImage: "/images/meta-preview.png",
  },
  "/virtual-staging-cost": {
    title: "How Much Does Virtual Staging Cost? | RoomStagerPro",
    description:
      "See virtual staging pricing per photo, package tiers, and cost drivers. Compare to traditional installs and learn when each model makes financial sense with RoomStagerPro.",
    canonicalPath: "/virtual-staging-cost",
    ogImage: "/images/meta-preview.png",
  },
  "/virtual-staging-for-investors": {
    title: "Virtual Staging for Investors | RoomStagerPro",
    description:
      "Deploy AI staging for BRRRR, flips, and STR portfolios. Cut DOM, lift offers, and scale marketing with deal-ready visuals from RoomStagerPro.",
    canonicalPath: "/virtual-staging-for-investors",
    ogImage: "/images/meta-preview.png",
  },
  "/virtual-staging-for-real-estate-agents": {
    title: "Virtual Staging for Real Estate Agents – RoomStagerPro",
    description:
      "Equip listings with MLS-safe virtual staging, overnight turnarounds, and seller-ready proof. Explore pricing, workflow, and gallery assets in one guide from RoomStagerPro.",
    canonicalPath: "/virtual-staging-for-real-estate-agents",
    ogImage: "/images/meta-preview.png",
  },
  "/virtual-staging-for-short-term-rentals": {
    title: "Virtual Staging for Short-Term Rentals | Boost Airbnb Bookings",
    description:
      "Professional virtual staging for Airbnb and VRBO properties. Increase bookings by 40% with AI-powered furniture placement. Transform empty rentals into desirable stays.",
    canonicalPath: "/virtual-staging-for-short-term-rentals",
    ogImage: "/images/meta-preview.png",
  },
  "/gallery": {
    title: "Before & After Virtual Staging Examples | RoomStagerPro",
    description:
      "Explore before and after virtual staging transformations that prove how AI-designed interiors win more clicks and offers.",
    canonicalPath: "/gallery/",
    ogImage: "/images/meta-preview.png",
  },
  "/how-it-works": {
    title: "How RoomStagerPro Works | Fast AI Staging Workflow",
    description:
      "See the four-step RoomStagerPro workflow: upload photos, pick a style, get 24-hour AI turnarounds, and download MLS-ready files.",
    canonicalPath: "/how-it-works",
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
  "/resources": {
    title: "Resources | Virtual Staging Guides, Pricing & Examples",
    description:
      "Guides, use-cases, pricing, and proof to help agents, investors, and STR hosts use virtual staging to convert faster.",
    canonicalPath: "/resources",
    ogImage: "/images/meta-preview.png",
  },
  "/privacy": {
    title: "Privacy Policy | RoomStagerPro",
    description:
      "Learn how RoomStagerPro collects, uses, and protects your information when you use our website and virtual staging services.",
    canonicalPath: "/privacy",
    ogImage: "/images/meta-preview.png",
  },
  "/terms": {
    title: "Terms of Service | RoomStagerPro",
    description:
      "Review the Terms of Service that govern your access to RoomStagerPro and the use of our virtual staging tools.",
    canonicalPath: "/terms",
    ogImage: "/images/meta-preview.png",
  },
  "/about": {
    title: "About RoomStagerPro | AI Virtual Staging",
    description:
      "Learn what RoomStagerPro is, who it’s for, and how our AI-assisted virtual staging helps listings stand out.",
    canonicalPath: "/about",
    ogImage: "/images/meta-preview.png",
  },
  "/contact": {
    title: "Contact RoomStagerPro | Support & Questions",
    description:
      "Contact RoomStagerPro for support, billing questions, or partnership inquiries about AI virtual staging.",
    canonicalPath: "/contact",
    ogImage: "/images/meta-preview.png",
  },
};
