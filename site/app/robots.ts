import type { MetadataRoute } from "next";
import { siteIndexavel, urlAbsoluta } from "@/lib/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  if (!siteIndexavel) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: urlAbsoluta("/sitemap.xml"),
  };
}
