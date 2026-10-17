export type GrumbleState = 'grumbling' | 'fed' | 'listening'

// The character's state, shared by the header and every screen (14 §Composables).
export const useGrumble = () => useState<GrumbleState>('grumble', () => 'grumbling')
