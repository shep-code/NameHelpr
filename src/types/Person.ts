export interface Person {
  id?: number;          // Auto-increment primary key
  name: string;
  context: string;      // Primary context (where you first met)
  contextTags?: string[]; // Secondary context tags (other places you've seen them)
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
