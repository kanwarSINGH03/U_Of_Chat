/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,ts,tsx,jsx}"],
  theme: {
    extend: {
      // Enable customizing the `backdrop-filter` utility if needed
      backdropFilter: {
        'none': 'none',
        'blur': 'blur(20px)',
      },
    },
  },
  // Explicitly enable the `backdropFilter` plugin if it's not included by default
  plugins: [
    require('tailwindcss-filters'),
  ],
  // If you are using Tailwind CSS v2.1+
  // You don't need the plugin, just enable the variants:
  variants: {
    extend: {
      // Add 'backdrop-filter' utilities to the list of variant-enabled utilities
      backdropFilter: ['responsive'], // or ['hover', 'focus'] as needed
    },
  },
}
