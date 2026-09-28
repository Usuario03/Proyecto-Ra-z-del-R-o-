export interface AccessibilityPreferences {
  textSize: 'normal' | 'large' | 'extra';
  readInstructions: boolean;
}
export const defaultAccessibility = (): AccessibilityPreferences => ({
  textSize:'normal', readInstructions:true,
});
