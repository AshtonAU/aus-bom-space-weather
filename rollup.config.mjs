const production = !process.env.ROLLUP_WATCH;

export default {
  input: 'src/aus-bom-space-weather-card.js',
  output: {
    file: 'custom_components/aus_bom_space_weather/www/aus-bom-space-weather-card.js',
    format: 'es',
    sourcemap: !production,
  },
  plugins: [],
};
