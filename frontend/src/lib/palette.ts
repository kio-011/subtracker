// Segment colors of the donut chart, taken from the mockups.
export const PALETTE = ['#f26b2a', '#f2b24a', '#3fb8a5', '#5b8def', '#a182ee', '#8d8d89']

export function colorAt(index: number): string {
  return PALETTE[index % PALETTE.length] ?? '#8d8d89'
}
