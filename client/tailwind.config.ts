import type { Config } from 'tailwindcss';

export default {
    darkMode: ['class'],
    content: ['./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}'],
  theme: {
  	extend: {
  		fontFamily: {
  			sans: [
  				'Inter"',
  				'ui-sans-serif',
  				'system-ui',
  				'sans-serif',
  				'Apple Color Emoji"',
  				'Segoe UI Emoji"',
  				'Segoe UI Symbol"',
  				'Noto Color Emoji"'
  			],
  			body: 'var(--body-font)',
  			heading: 'var(--heading-font)'
  		},
  		colors: {
  			body: 'var(--body)',
  			'body-text': 'var(--text)',
  			widget: 'var(--widget)',
  			header: 'var(--header)',
  			border: 'hsl(var(--border))',
  			'input-border': 'var(--input-border)',
  			'input-bg': 'var(--input-bg)',
  			highlight: 'var(--highlight)',
  			'highlight-inverse': 'var(--highlight-inverse)',
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			'green-darker': '#02A189',
  			'gray-red': 'var(--text-dark)',
  			neutral: {
  				'50': '#f7f7f7',
  				'100': '#eeeeee',
  				'200': '#e0e0e0',
  				'300': '#cacaca',
  				'400': '#b1b1b1',
  				'500': '#999999',
  				'600': '#7f7f7f',
  				'700': '#676767',
  				'800': '#545454',
  				'900': '#464646',
  				'950': '#282828'
  			},
  			primary: {
  				'50': '#f3f1ff',
  				'100': '#e9e5ff',
  				'200': '#d5cfff',
  				'300': '#b7a9ff',
  				'400': '#9478ff',
  				'500': '#7341ff',
  				'600': '#631bff',
  				'700': '#611bf8',
  				'800': '#4607d0',
  				'900': '#3c08aa',
  				'950': '#220174',
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		screens: {
  			'2xs': '375px',
  			xs: '414px',
  			'3xl': '1366px',
  			'4xl': '1920px',
  			'5xl': '2048px'
  		},
  		transitionDuration: {
  			DEFAULT: '300ms'
  		},
  		borderColor: {
  			DEFAULT: 'var(--border)'
  		},
  		boxShadow: {
  			DEFAULT: 'var(--shadow)',
  			banner: '0 2px 13px rgba(0, 54, 139, 0.44)',
  			switch: 'inset 0 1px 3px rgba(170, 170, 183, 0.57)',
  			'switch-dark': 'inset 0 1px 3px rgba(2, 2, 6, 0.57)'
  		},
  		animation: {
  			'spin-slow': 'spin 3s linear infinite',
  			'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  			'ping-slow': 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		}
  	}
  },
  safelist: [
    'text-center',
    'text-left',
    'text-right',
    'text-justify',
    'grid-cols-12',
    'grid-cols-11',
    'grid-cols-10',
    'grid-cols-9',
    'grid-cols-8',
    'grid-cols-7',
    'grid-cols-6',
    'grid-cols-5',
    'grid-cols-4',
    'grid-cols-3',
    'grid-cols-2',
    'grid-cols-1',
    'col-span-12',
    'col-span-11',
    'col-span-10',
    'col-span-9',
    'col-span-8',
    'col-span-7',
    'col-span-6',
    'col-span-5',
    'col-span-4',
    'col-span-3',
    'col-span-2',
    'col-span-1',
    'col-span-10',
    'col-span-9',
  ],
  important: true,
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
