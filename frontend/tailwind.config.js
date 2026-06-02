/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      // Los tokens de tema del negocio se inyectan desde theme.config.ts
      // vía variables CSS en la capa @base. No hardcodear colores aquí.
    },
  },
  plugins: [],
};
