import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 拼多多风格配色
        primary: {
          DEFAULT: '#E54C3C',
          light: '#FF6B6B',
          bg: '#FFE5E5',
        },
        text: {
          primary: '#333333',
          secondary: '#666666',
          light: '#999999',
        },
        bg: {
          card: '#FFFFFF',
          page: '#F5F5F5',
        },
        border: {
          DEFAULT: '#EEEEEE',
        },
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'button': '0 2px 8px rgba(229, 76, 60, 0.25)',
        'button-light': '0 2px 4px rgba(255, 107, 107, 0.25)',
      },
    },
  },
  plugins: [],
};
export default config;
