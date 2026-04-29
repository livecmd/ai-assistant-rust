/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./**/*.{js,ts,jsx,tsx}"],
  theme: {
    screens: {
      xs: "480px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        // 自定义背景色
        primary: {
          bg: "#060606", // 统一背景色
          dark: "#020617", // 深一点的颜色用于侧边栏或输入框
          light: "#1e293b", // 浅一点的颜色用于气泡
        },
      },
      animation: {
        fadeIn: "fadeIn 0.3s ease-out forwards",
        fadeInUp: "fadeInUp 0.4s ease-out forwards",
        fadeInDown: "fadeInDown 0.4s ease-out forwards",
        scaleIn: "scaleIn 0.3s ease-out forwards",
        slideInLeft: "slideInLeft 0.4s ease-out forwards",
        slideInRight: "slideInRight 0.4s ease-out forwards",
        float: "float 3s ease-in-out infinite",
        glow: "glow 2s ease-in-out infinite",
        shimmer: "shimmer 1.5s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeInDown: {
          "0%": { opacity: "0", transform: "translateY(-20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-30px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(30px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        glow: {
          "0%, 100%": {
            boxShadow:
              "0 0 5px rgba(99, 102, 241, 0.3), 0 0 10px rgba(99, 102, 241, 0.2)",
          },
          "50%": {
            boxShadow:
              "0 0 15px rgba(99, 102, 241, 0.5), 0 0 25px rgba(99, 102, 241, 0.3)",
          },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      transitionTimingFunction: {
        "bounce-in": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      },
    },
  },
  plugins: [],
};
