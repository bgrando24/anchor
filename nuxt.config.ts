import tailwindcss from "@tailwindcss/vite";
import lgaFile from "./app/data/lgas.json";

// Every route is prerendered to static HTML, including one page per area, so Workbox can
// precache the HTML and an offline reload works on any route.
const AREA_ROUTES = (lgaFile as { lgas: { lga_code: number }[] }).lgas.map(
  (l) => `/results/${l.lga_code}`,
);
const STATIC_ROUTES = [
  "/",
  "/income",
  "/bedrooms",
  "/location",
  "/location/area",
  "/schools",
  "/priorities",
  "/results",
  "/results/print",
  "/share",
  "/faq",
  "/invalid-link",
];

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  // Dev over TLS, so a secure origin is available locally. Needs a certificate pair, which is
  // untracked: run `mkcert localhost` in the repo root to make one. Cloudflare terminates TLS
  // for the deployed site, so this is dev only.
  devServer: { https: { key: "localhost-key.pem", cert: "localhost.pem" } },
  modules: ["@vite-pwa/nuxt"],
  css: ["~/assets/css/main.css"],
  vite: {
    plugins: [tailwindcss()],
  },
  nitro: {
    // No preset here: Cloudflare's build auto-detects its own, and pinning one stops Nitro
    // emitting the Worker entry that `wrangler versions upload` needs. Prerendering works
    // under any preset, and it is the prerendered HTML that Workbox precaches.
    prerender: {
      crawlLinks: true,
      failOnError: false,
      routes: [...STATIC_ROUTES, ...AREA_ROUTES],
    },
  },
  app: {
    head: {
      meta: [
        {
          name: "description",
          content:
            "Which Victorian council area could you afford to stay in?",
        },
      ],
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
        { rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png" },
        // The typefaces are served from this site, so there is nothing to preconnect to and
        // nothing to fetch from another origin. See the @font-face block in tokens.css.
        {
          rel: "preload",
          as: "font",
          type: "font/woff2",
          href: "/fonts/plex-sans-var.woff2",
          crossorigin: "anonymous",
        },
      ],
    },
  },
  pwa: {
    registerType: "autoUpdate",
    manifest: {
      name: "Anchor",
      short_name: "Anchor",
      description:
        "Rank all 79 Victorian council areas by how much of your income the rent would take.",
      theme_color: "#1B2A3A",
      background_color: "#F2EEE8",
      display: "standalone",
      start_url: "/",
      icons: [
        { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
        {
          src: "/icons/icon-maskable-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    },
    workbox: {
      // The prerendered HTML is what makes the offline reload work.
      globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,webmanifest}"],
      // 79 area pages plus chunks: the default 2MB cap is not enough.
      maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      navigateFallback: "/",
      cleanupOutdatedCaches: true,
    },
    devOptions: {
      enabled: false,
    },
  },
});
