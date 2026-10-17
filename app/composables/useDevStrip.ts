// Routes currently showing their fixture because the API call failed. A later success removes the route,
// and DevStrip clears the list on navigation, so the chip only means "this page fell back" (14 §Layout).
export const useDevStrip = () => useState('devStrip', () => ({ fallbacks: [] as string[] }))
