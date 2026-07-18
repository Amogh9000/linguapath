import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background:                    "var(--color-background, #fbf9f8)",
        "on-background":               "var(--color-on-background, #1b1c1c)",
        surface:                       "var(--color-surface, #fbf9f8)",
        "surface-dim":                 "var(--color-surface-dim, #dbd9d9)",
        "surface-bright":              "var(--color-surface-bright, #fbf9f8)",
        "surface-container-lowest":    "var(--color-surface-container-lowest, #ffffff)",
        "surface-container-low":       "var(--color-surface-container-low, #f5f3f3)",
        "surface-container":           "var(--color-surface-container, #efeded)",
        "surface-container-high":      "var(--color-surface-container-high, #eae8e7)",
        "surface-container-highest":   "var(--color-surface-container-highest, #e4e2e2)",
        "on-surface":                  "var(--color-on-surface, #1b1c1c)",
        "on-surface-variant":          "var(--color-on-surface-variant, #3f4a36)",
        outline:                       "var(--color-outline, #6f7b64)",
        primary:                       "var(--color-primary, #2b6c00)",
        "on-primary":                  "var(--color-on-primary, #ffffff)",
        "primary-container":           "var(--color-primary-container, #58cc02)",
        "on-primary-container":        "var(--color-on-primary-container, #1e5000)",
        "inverse-primary":             "var(--color-inverse-primary, #6be026)",
        secondary:                     "var(--color-secondary, #006590)",
        "on-secondary":                "var(--color-on-secondary, #ffffff)",
        "secondary-container":         "var(--color-secondary-container, #2fb8ff)",
        "on-secondary-container":      "var(--color-on-secondary-container, #004666)",
        tertiary:                      "var(--color-tertiary, #755b00)",
        "on-tertiary":                 "var(--color-on-tertiary, #ffffff)",
        "tertiary-container":          "var(--color-tertiary-container, #ddad00)",
        "on-tertiary-container":       "var(--color-on-tertiary-container, #574300)",
        error:                         "var(--color-error, #ba1a1a)",
        "on-error":                    "var(--color-on-error, #ffffff)",
        "error-container":             "var(--color-error-container, #ffdad6)",
        "on-error-container":          "var(--color-on-error-container, #93000a)",
        "primary-fixed":               "var(--color-primary-fixed, #87fe45)",
        "primary-fixed-dim":           "var(--color-primary-fixed-dim, #6be026)",
        "on-primary-fixed":            "var(--color-on-primary-fixed, #082100)",
        "on-primary-fixed-variant":    "var(--color-on-primary-fixed-variant, #1f5100)",
        "secondary-fixed":             "var(--color-secondary-fixed, #c8e6ff)",
        "secondary-fixed-dim":         "var(--color-secondary-fixed-dim, #88ceff)",
        "on-secondary-fixed":          "var(--color-on-secondary-fixed, #001e2e)",
        "on-secondary-fixed-variant":  "var(--color-on-secondary-fixed-variant, #004c6e)",
        "tertiary-fixed":              "var(--color-tertiary-fixed, #ffdf92)",
        "tertiary-fixed-dim":          "var(--color-tertiary-fixed-dim, #f4bf00)",
        "on-tertiary-fixed":           "var(--color-on-tertiary-fixed, #241a00)",
        "on-tertiary-fixed-variant":   "var(--color-on-tertiary-fixed-variant, #594400)",
        "surface-variant":             "var(--color-surface-variant, #e4e2e2)",
      },
      fontFamily: {
        sans: ['var(--font-nunito-sans)', 'sans-serif'],
      },
      borderRadius: {
        'sm': '0.5rem',
        DEFAULT: '1rem',
        'md': '1.5rem',
        'lg': '2rem',
        'xl': '3rem',
        'full': '9999px',
      },
      spacing: {
        'base': '8px',
        'gutter': '24px',
      },
      maxWidth: {
        '1200': '1200px',
      }
    },
  },
  plugins: [],
};
export default config;

