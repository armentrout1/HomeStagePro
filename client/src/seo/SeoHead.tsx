import { Helmet } from "react-helmet-async";
import { ROUTE_SEO, SITE_ORIGIN } from "./routesSeo";

type SeoHeadProps = {
  path: string;
};

export function SeoHead({ path }: SeoHeadProps) {
  const seo = ROUTE_SEO[path] ?? {
    title: "Page not found | RoomStagerPro",
    description: "This page could not be found.",
    canonicalPath: path,
    robots: "noindex, follow",
    ogImage: undefined,
  };
  const canonicalUrl = `${SITE_ORIGIN}${seo.canonicalPath}`;
  const ogImageUrl = seo.ogImage ? `${SITE_ORIGIN}${seo.ogImage}` : undefined;

  return (
    <Helmet>
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta name="robots" content={seo.robots || "index, follow"} />
      {ogImageUrl && <meta property="og:image" content={ogImageUrl} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
      {ogImageUrl && <meta name="twitter:image" content={ogImageUrl} />}
    </Helmet>
  );
}
