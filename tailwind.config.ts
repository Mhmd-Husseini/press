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
      fontSize: {
        // Enhanced font sizes for better readability
        'xs': ['0.875rem', { lineHeight: '1.5' }],      // 14px
        'sm': ['1rem', { lineHeight: '1.6' }],          // 16px
        'base': ['1.125rem', { lineHeight: '1.7' }],    // 18px
        'lg': ['1.25rem', { lineHeight: '1.7' }],       // 20px
        'xl': ['1.375rem', { lineHeight: '1.6' }],      // 22px
        '2xl': ['1.5rem', { lineHeight: '1.5' }],       // 24px
        '3xl': ['1.875rem', { lineHeight: '1.4' }],     // 30px
        '4xl': ['2.25rem', { lineHeight: '1.3' }],      // 36px
        '5xl': ['3rem', { lineHeight: '1.2' }],         // 48px
        '6xl': ['3.75rem', { lineHeight: '1.1' }],      // 60px
        // Arabic-specific larger sizes
        'ar-sm': ['1.125rem', { lineHeight: '1.8' }],   // 18px for Arabic small text
        'ar-base': ['1.25rem', { lineHeight: '1.8' }],  // 20px for Arabic base text
        'ar-lg': ['1.5rem', { lineHeight: '1.7' }],     // 24px for Arabic large text
        'ar-xl': ['1.75rem', { lineHeight: '1.6' }],    // 28px for Arabic extra large
        'ar-2xl': ['2rem', { lineHeight: '1.5' }],      // 32px for Arabic headings
        'ar-3xl': ['2.5rem', { lineHeight: '1.4' }],    // 40px for Arabic large headings
      },
      fontFamily: {
        // Enhanced font families
        'sans': ['Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        'arabic': ['Noto Naskh Arabic', 'Cairo', 'Tajawal', 'Amiri', 'Noto Sans Arabic', 'Arial', 'sans-serif'],
        'heading': ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
        'arabic-heading': ['Noto Naskh Arabic', 'Cairo', 'Tajawal', 'Amiri', 'sans-serif'],
      },
      fontWeight: {
        'light': '300',
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
        'extrabold': '800',
      },
      letterSpacing: {
        'tighter': '-0.05em',
        'tight': '-0.025em',
        'normal': '0em',
        'wide': '0.025em',
        'wider': '0.05em',
        'widest': '0.1em',
        // Arabic-specific letter spacing
        'ar-tight': '-0.01em',
        'ar-normal': '0em',
        'ar-wide': '0.02em',
      },
      lineHeight: {
        'none': '1',
        'tight': '1.25',
        'snug': '1.375',
        'normal': '1.5',
        'relaxed': '1.625',
        'loose': '2',
        // Arabic-specific line heights
        'ar-tight': '1.4',
        'ar-normal': '1.7',
        'ar-relaxed': '1.9',
      }
    },
  },
  plugins: [],
  future: {
    // This makes Tailwind more resilient to missing files
    // in content patterns by using glob patterns more safely
    hoverOnlyWhenSupported: true, 
  },
} satisfies Config;
