/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#070a12", // space black
        panel: "#0e1424", // raised surface
        ink: "#e7ecf7", // main text (light)
        "ink-2": "#b6c0d6", // mid text (descriptive body copy)
        muted: "#8b96ad", // muted text (space gray)
        line: "#2a3650", // connector lines
        hair: "#1b2438", // ui hairlines
        node: "#0f1830", // node fill
        "node-2": "#14203c", // domain / child nodes
        accent: "#5b8cff", // space blue
      },
      fontFamily: {
        display: ["'Instrument Serif'", "Georgia", "'Times New Roman'", "serif"],
        ui: [
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      transitionTimingFunction: {
        soft: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};
