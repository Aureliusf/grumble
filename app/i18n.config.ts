// Missing Spanish strings show English, never a key (00 §pre-agreed answers).
export default defineI18nConfig(() => ({
  fallbackLocale: 'en',
  missingWarn: false,
  fallbackWarn: false,
}))
