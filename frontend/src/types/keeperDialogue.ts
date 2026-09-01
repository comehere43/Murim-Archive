export type KeeperEventType =
  | "normal"
  | "title"
  | "realm_up"
  | "book_completed";

export type KeeperExpression = "normal" | "happy" | "surprised";

export type KeeperDialogue = {
  id: string;
  eventType: KeeperEventType;
  speaker: string;
  text: string;
  expression: KeeperExpression;
};
