module.exports = {
  theme: {
    extend: {
      colors: {
        "custom-primary": "#001736",
        "custom-primary-variant": "#0B1B3F",
        "custom-secondary": "#DADDD8",
        "custom-secondary-variant": "#FAFAFF",
        "custom-contrast": "#e5035f",
        "glass": {
          base: "rgba(255, 255, 255, 0.08)",
          hover: "rgba(255, 255, 255, 0.12)",
          border: "rgba(255, 255, 255, 0.18)",
          "border-highlight": "rgba(255, 255, 255, 0.28)",
          highlight: "rgba(255, 255, 255, 0.3)",
        },
      },
      backdropBlur: {
        vision: "24px",
      },
      borderRadius: {
        vision: "24px",
      },
      boxShadow: {
        glass:
          "inset 0 1px 1px 0 rgba(255, 255, 255, 0.3), 0 20px 40px rgba(0, 0, 0, 0.4)",
        "glass-hover":
          "inset 0 1px 1px 0 rgba(255, 255, 255, 0.4), 0 28px 56px rgba(0, 0, 0, 0.45)",
      },
      transitionTimingFunction: {
        vision: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      transitionDuration: {
        vision: "300ms",
      },
      fontSize: {
        "10xl": "10rem",
        "11xl": "12rem",
      },
      fontFamily: {
        impact: ["Impact", "sans-serif"],
        jetbrains: ["JetBrainsMono", "monospace"],
        "helvethaica-blk-cond": ["DBHelvethaicaXBlkCond", "sans-serif"],
        "helvethaica-med-cond": ["DBHelvethaicaXMedCond", "sans-serif"],
        "thsarabun-new": ["THSarabunNew", "sans-serif"],
      },
      maxHeight: {
        140: "35rem",
      },
    },
  },
  plugins: [],
};
