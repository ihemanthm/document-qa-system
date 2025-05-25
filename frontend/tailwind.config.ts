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
        'light-grey-bg': '#f5f5f5',
        'primary-green': '#28a745',
        'hover-green': '#218838',
        'user-bubble-green': '#e6ffe6',
        'bot-bubble-grey': '#f0f0f0',
        'text-dark': '#333333',
        'text-medium': '#666666',
        'border-light': '#e0e0e0',
      },
    },
  },
  plugins: [],
} satisfies Config;
