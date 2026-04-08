export type ViewType =
  | { type: 'main' }
  | { type: 'help' }
  | { type: 'context-detail'; context: string };
