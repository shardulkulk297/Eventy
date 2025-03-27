/* Eventy/Frontend/tailwind.config.js */
// tailwind.config.js

import animate from 'tailwindcss-animate'; // Or require('tailwindcss-animate')

export default {
  darkMode: ["class"],
  // Ensure content path includes the new FormBuilder feature directory
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}", // Original path
    "./src/features/FormBuilder/**/*.{ts,tsx,js,jsx}" // Added path for FormBuilder
  ],
  theme: {
    // Container settings from Form Builder (optional, adjust as needed)
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      colors: {
        // Base colors merged (Form Builder defaults might override Eventy's)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        // Kept Eventy's specific sidebar colors
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))'
        },
        // Added Form Builder Specific Colors
        form: {
          'light-blue': '#E8F0FE',
          'accent-blue': '#4285F4',
          'hover-blue': '#2D76DC',
          'card-border': '#DADCE0',
          'accent-purple': '#673AB7',
          'accent-green': '#0F9D58',
          'accent-red': '#DB4437',
          'accent-orange': '#F4B400',
          'light-gray': '#F8F9FA',
          'medium-gray': '#F1F3F4',
          'dark-gray': '#5F6368',
          'white': '#FFFFFF'
        }
      },
      // Added borderRadius from Form Builder (adjust if needed)
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        // Kept Eventy's accordion keyframes
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        },
        // Added Keyframes from Form Builder
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)'},
          '100%': { opacity: '1', transform: 'translateY(0)'},
        },
        'fade-out': {
          '0%': { opacity: '1', transform: 'translateY(0)'},
          '100%': { opacity: '0', transform: 'translateY(-10px)'},
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)'},
          '100%': { opacity: '1', transform: 'scale(1)'},
        },
        'slide-in': {
          '0%': { transform: 'translateX(100%)'},
          '100%': { transform: 'translateX(0)'},
        },
        'slide-out': {
          '0%': { transform: 'translateX(0)'},
          '100%': { transform: 'translateX(-100%)'},
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)'},
          '50%': { transform: 'translateY(-5px)'},
        }
      },
      animation: {
        // Kept Eventy's accordion animations
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        // Added Animations from Form Builder
        'fade-in': 'fade-in 0.3s ease-out',
        'fade-out': 'fade-out 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
        'slide-out': 'slide-out 0.3s ease-out',
        'float': 'float 3s ease-in-out infinite',
      },
      // Added boxShadow & blur from Form Builder
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'elevation-1': '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.14)',
        'elevation-2': '0 3px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.12)',
        'elevation-3': '0 10px 20px rgba(0,0,0,0.10), 0 3px 6px rgba(0,0,0,0.05)',
        'blue-glow': '0 0 15px rgba(66, 133, 244, 0.3)',
      },
      backdropBlur: {
        'xs': '2px',
      }
    }
  },
  // Ensure tailwindcss-animate plugin is included
  plugins: [animate],
// --- FIX: Removed extra closing brace ---
};
