import { Helmet } from "react-helmet-async";
import { ROUTE_SEO, SITE_ORIGIN } from "./routesSeo";

type SeoHeadProps = {
  path: string;
};

export function SeoHead({ path }: SeoHeadProps) {
  const seo = ROUTE_SEO[path] ?? ROUTE_SEO["/"];
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
      {seo.robots && <meta name="robots" content={seo.robots} />}
      {ogImageUrl && <meta property="og:image" content={ogImageUrl} />}
    </Helmet>
  );
}
