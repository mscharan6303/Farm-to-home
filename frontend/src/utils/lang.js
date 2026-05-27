export const t = (en, hi) => {
  return localStorage.getItem("lang") === "hi" ? hi : en;
};
