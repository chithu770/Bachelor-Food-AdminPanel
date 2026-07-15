/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./public/index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"]
      },
      colors: {
        ink: "#0f172a",
        ember: "#e11d48", // A richer, slightly deeper rose/red instead of plain #ef4444
        saffron: "#f59e0b",
        leaf: "#16a34a"
      },
      boxShadow: {
        soft: "0 4px 20px -2px rgba(15, 23, 42, 0.05)",
        premium: "0 10px 40px -10px rgba(15, 23, 42, 0.08)",
        "premium-hover": "0 20px 40px -10px rgba(15, 23, 42, 0.12)",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        }
      },
      animation: {
        "fade-in-up": "fade-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in": "fade-in 0.3s ease-out forwards",
      }
    }
  },
  plugins: []
};
