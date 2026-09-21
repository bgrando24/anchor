import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@vite-pwa/nuxt"],
  css: ["~/assets/css/main.css"],
  vite: {
    plugins: [tailwindcss()],
  },
  app: {
    head: {
      meta: [
        {
          name: "description",
          content: "Which Victorian council area could you afford to stay in?",
        },
      ],
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossorigin: "anonymous",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap",
        },
        { rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png" },
      ],
    },
  },
  pwa: {
    registerType: "autoUpdate",
    manifest: {
      name: "ANCHOR",
      short_name: "ANCHOR",
      description:
        "Which Victorian council area could you afford to stay in? Ranks all 79 LGAs by rent affordability and stability, weighted by what matters to you.",
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
      globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
    },
    devOptions: {
      enabled: false,
    },
  },
});
