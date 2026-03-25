export type ViewType =
  | { type: 'main' }
  | { type: 'help' }
  | { type: 'context-detail'; context: string }
  | { type: 'person-detail'; personId: number }
  | { type: 'add-person'; initialContext?: string }
  | { type: 'edit-person'; personId: number };
