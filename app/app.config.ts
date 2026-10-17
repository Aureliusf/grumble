export default defineAppConfig({
  ui: {
    colors: { primary: 'grumble', secondary: 'cafecito', neutral: 'stone', success: 'green', warning: 'amber', error: 'red' },
    button: { slots: { base: 'rounded-full font-display font-semibold' }, defaultVariants: { size: 'xl' } },
    card: { slots: { root: 'rounded-[var(--radius-grumble)] shadow-sm ring-0 bg-white dark:bg-crema-900' } },
  },
})
