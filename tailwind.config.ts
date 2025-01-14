import plugin from "tailwindcss/plugin";
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "hsl(var(--background))",
          hover: "hsl(var(--background-hover))",
        },
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        "muted-more": {
          DEFAULT: "hsl(var(--muted-more))",
          foreground: "hsl(var(--muted-more-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        shadow: "hsl(var(--shadow))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
          "6": "hsl(var(--chart-6))",
        },
        banano: "hsl(var(--banano))",
        nano: "hsl(var(--nano))",
        index: {
          fear: "hsl(var(--index-fear))",
          neutral: "hsl(var(--index-neutral))",
          greed: "hsl(var(--index-greed))",
        },
        google: {
          DEFAULT: "hsl(var(--google))",
          foreground: "hsl(var(--google-foreground))",
        },
        discord: {
          DEFAULT: "hsl(var(--discord))",
          foreground: "hsl(var(--discord-foreground))",
        },
        github: {
          DEFAULT: "hsl(var(--github))",
          foreground: "hsl(var(--github-foreground))",
        },
        ethereum: {
          DEFAULT: "hsl(var(--ethereum))",
          foreground: "hsl(var(--ethereum-foreground))",
        },
        email: {
          DEFAULT: "hsl(var(--email))",
          foreground: "hsl(var(--email-foreground))",
        },
        x: {
          DEFAULT: "hsl(var(--x))",
          foreground: "hsl(var(--x-foreground))",
        },
        barrier: "hsl(var(--barrier))",
      },
      opacity: {
        2: "0.02",
        3: "0.03",
        8: "0.08",
        12: "0.12",
        36: "0.36",
        85: "0.85",
      },
      transitionDuration: {
        250: "250ms",
        2000: "2000ms",
        5000: "5000ms",
      },
      fontSize: {
        xxs: ["0.625rem", "1rem"],
        "base-doc": ["1.125rem", "1.5"],
      },
      borderWidth: {
        "1.5": "1.5px",
      },
      rotate: {
        30: "30deg",
        360: "360deg",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      spacing: {
        "2px": "2px",
        0.25: "0.0625rem",
        0.75: "0.1875rem",
        1.25: "0.3125rem",
        1.75: "0.4375rem",
        2.25: "0.5625rem",
        2.75: "0.6875rem",
        3.25: "0.8125rem",
        3.75: "0.9375rem",
        4.25: "1.0625rem",
        4.5: "1.125rem",
        5.25: "1.3125rem",
        5.5: "1.375rem",
        6.5: "1.625rem",
        8.5: "2.125rem",
        9.5: "2.375rem",
        10.5: "2.625rem",
        10.75: "2.6875rem",
        13: "3.25rem",
        14.25: "3.5625rem",
        14.5: "3.625rem",
        15: "3.75rem",
        17: "4.25rem",
        18: "4.5rem",
        19: "4.75rem",
        21: "5.25rem",
        22: "5.5rem",
        26: "6.5rem",
        27: "6.75rem",
        30: "7.5rem",
        31: "7.75rem",
        34: "8.5rem",
        35: "8.75rem",
        "35.5": "8.875rem",
        37: "9.25rem",
        38: "9.5rem",
        88: "22rem",
        90: "22.5rem",
        92: "23rem",
        94: "23.5rem",
        96: "24rem",
        100: "25rem",
        102: "25.5rem",
        104: "26rem",
        112: "28rem",
        120: "30rem",
        128: "32rem",
        132: "33rem",
        134: "33.5rem",
        136: "34rem",
        150: "37.5rem",
        156: "39rem",
        160: "40rem",
        164: "41rem",
        166: "41.5rem",
        167: "41.75rem",
        168: "42rem",
      },
      ringWidth: {
        3: "3px",
      },
      boxShadow: {
        navbar: "0rem 0rem 0.5rem 0rem, 0rem 0rem 0.75rem 0rem",
        dialog: "0rem 0.5rem 1rem 0rem",
        "card-highlight": "inset 0rem 0rem 0rem 4px",
      },
    },
    animation: {
      skeleton: "skeleton 1.25s ease-in-out infinite",
      "pulse-scale": "pulse-scale 1s ease-in-out infinite",
      spin: "spin 1s linear infinite",
    },
    keyframes: {
      skeleton: {
        "0%": {
          opacity: "20%",
        },
        "50%": {
          opacity: "40%",
        },
        "100%": {
          opacity: "20%",
        },
      },
      "pulse-scale": {
        "0%": {
          transform: "scale(0.7)",
        },
        "50%": {
          transform: "scale(1.4)",
        },
        "100%": {
          transform: "scale(0.7)",
        },
      },
      spin: {
        "0%": {
          transform: "rotate(0deg)",
        },
        "100%": {
          transform: "rotate(360deg)",
        },
      },
    },
  },
  plugins: [
    plugin(function ({ addVariant }) {
      addVariant("not-touch", ".not-touch &"); // here
    }),
    require("tailwindcss-animate"),
  ],
};
export default config;
