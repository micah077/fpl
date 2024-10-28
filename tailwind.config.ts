// tailwind.config.ts

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "gradient-radial-headerImg":
          "radial-gradient(circle, #001E09 10%, #000000 100%)",
        "primary-gradient":
          "linear-gradient(90deg, #d4f475 0%, #72fa72 56%, #20fecd 100%)",
        "secondary-gradient":
          "linear-gradient(90deg, rgba(212, 244, 117, 0.55) 0%, rgba(114, 250, 114, 0.55) 25%, rgba(212, 244, 117, 0.55) 81.16%, rgba(32, 254, 205, 0.55) 100%)",
        "third-gradient":
          "linear-gradient(rgba(255, 255, 255, 0) 200px, white 320px), url(/backgroundColors.png), linear-gradient(to right, rgb(2, 239, 255), rgb(98, 123, 255));",
          "fourth-gradient":
          "linear-gradient(rgba(255, 255, 255, 0) 900px, white 280px), url(/background-gradient-4.png), linear-gradient(to right, rgb(2, 239, 255), rgb(0, 255, 135));",
          "fifth-gradient":
          "linear-gradient(rgba(255, 255, 255, 0) 150px, white 600px), url(/backgroundColors.png), linear-gradient(to right, rgb(2, 239, 255), rgb(98, 123, 255));",
        
      },
      colors: {
        // headerLeagueGreen: "#2C4529",
        // headerLeagueGreenBorder: "#375832",
        // infoButtonColor: "#1FDA00",

        "primary-green": "#72fa72",
        "secondary-green": "#2b4528",
        "icon-green": "#1fda00",
        "icon-red": "#f15a24",
        "primary-gray": "#494949",
        "secondary-gray": "#606060",
        "off-white": "#f6f6f6",
        "light-black": "rgba(0, 0, 0, 0.8);",
      },
      boxShadow: {
        primary: "-2px 4px 4px 0px rgba(0, 0, 0, 0.03)",
      },
    },
  },
  plugins: [],
};

export default config;
