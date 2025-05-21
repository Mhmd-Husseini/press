import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "primary-bg": "var(--primary-bg)",
        "secondary-bg": "var(--secondary-bg)",
        "accent": "var(--accent-color)",
        "text-light": "var(--text-light)",
        "text-dark": "var(--text-dark)",
        "border": "var(--border-color)",
      },
    },
  },
  plugins: [],
  future: {
    // This makes Tailwind more resilient to missing files
    // in content patterns by using glob patterns more safely
    hoverOnlyWhenSupported: true, 
  },
} satisfies Config;
