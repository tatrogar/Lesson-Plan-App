/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        warn: "#f59e0b",
        err: "#dc2626",
        ok: "#16a34a",
      },
    },
  },
  plugins: [],
};
