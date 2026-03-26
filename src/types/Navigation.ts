export type ViewType =
  | { type: 'main' }
  | { type: 'help' }
  | { type: 'context-detail'; context: string }
  | { type: 'person-detail'; personId: number }
  | { type: 'edit-person'; personId: number };
