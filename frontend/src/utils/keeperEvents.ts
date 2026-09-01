import type { ProfileTitle } from "../api/titles";
import type { ProfileRealmEvent } from "../api/realms";
import type { KeeperDialogue } from "../types/keeperDialogue";
import type { BookCompletionEvent } from "../api/completions";

import {
  CONTINUATION_TITLE_EVENT_LINES,
  getFirstTitleEventLine,
  getTitleAcquiredLine,
  TITLE_DEFINITIONS,
} from "./titleDefinitions";

import {
  CONTINUATION_REALM_EVENT_LINES,
  getFirstRealmEventLine,
  getRealmAcquiredLine,
} from "./realmEventDefinitions";

import {
  CONTINUATION_BOOK_COMPLETION_LINES,
  getBookCompletionLine,
  getBookCompletionOpeningLine,
} from "./bookCompletionEventDefinitions";

export type KeeperEvent =
  | {
      type: "title";
      acquiredAt: string;
      data: ProfileTitle;
    }
  | {
      type: "realm_up";
      acquiredAt: string;
      data: ProfileRealmEvent;
    }
  | {
      type: "book_completed";
      acquiredAt: string;
      data: BookCompletionEvent;
    };

export function createKeeperEventQueue(
  titles: ProfileTitle[],
  realms: ProfileRealmEvent[],
  completions: BookCompletionEvent[],
): KeeperEvent[] {
  const titleEvents: KeeperEvent[] = titles.map((title) => ({
    type: "title",
    acquiredAt: title.acquired_at,
    data: title,
  }));

  const realmEvents: KeeperEvent[] = realms.map((realm) => ({
    type: "realm_up",
    acquiredAt: realm.acquired_at,
    data: realm,
  }));

  const completionEvents: KeeperEvent[] = completions.map((completion) => ({
    type: "book_completed",
    acquiredAt: completion.acquired_at,
    data: completion,
  }));

  const priority = {
    realm_up: 1,
    title: 2,
    book_completed: 3,
  } as const;

  return [...realmEvents, ...titleEvents, ...completionEvents].sort((a, b) => {
    if (priority[a.type] !== priority[b.type]) {
      return priority[a.type] - priority[b.type];
    }

    return new Date(a.acquiredAt).getTime() - new Date(b.acquiredAt).getTime();
  });
}

export function createTitleDialogues(
  title: ProfileTitle,
  position: string,
  eventIndex: number,
): KeeperDialogue[] {
  const definition = TITLE_DEFINITIONS[title.title_key];

  return [
    {
      id: `title-${title.id}-opening`,
      eventType: "title",
      speaker: "서고지기",
      text:
        eventIndex === 0
          ? getFirstTitleEventLine(position)
          : CONTINUATION_TITLE_EVENT_LINES[
              (eventIndex - 1) % CONTINUATION_TITLE_EVENT_LINES.length
            ],
      expression: "surprised",
    },
    {
      id: `title-${title.id}-rumor`,
      eventType: "title",
      speaker: "서고지기",
      text:
        definition?.rumor(position) ??
        "강호에 새로운 이야기가 퍼지고 있다 하옵니다.",
      expression: "normal",
    },
    {
      id: `title-${title.id}-acquired`,
      eventType: "title",
      speaker: "서고지기",
      text: getTitleAcquiredLine(title.title_key, position),
      expression: "happy",
    },
  ];
}

export function createRealmDialogues(
  realm: ProfileRealmEvent,
  position: string,
  eventIndex: number,
  events: KeeperEvent[],
): KeeperDialogue[] {
  const previousEvent = events[eventIndex - 1];

  const isContinuation = eventIndex > 0 && previousEvent?.type === "realm_up";

  const openingLine = isContinuation
    ? CONTINUATION_REALM_EVENT_LINES[
        (eventIndex - 1) % CONTINUATION_REALM_EVENT_LINES.length
      ]
    : getFirstRealmEventLine(position);

  return [
    {
      id: `realm-${realm.id}-opening`,
      eventType: "realm_up",
      speaker: "서고지기",
      text: openingLine,
      expression: "surprised",
    },
    {
      id: `realm-${realm.id}-acquired`,
      eventType: "realm_up",
      speaker: "서고지기",
      text: getRealmAcquiredLine(position, realm.realm_name),
      expression: "happy",
    },
  ];
}

export function createBookCompletionDialogues(
  completion: BookCompletionEvent,
  position: string,
  eventIndex: number,
  events: KeeperEvent[],
): KeeperDialogue[] {
  const previousEvent = events[eventIndex - 1];

  const isContinuation =
    eventIndex > 0 && previousEvent?.type === "book_completed";

  const openingLine = isContinuation
    ? CONTINUATION_BOOK_COMPLETION_LINES[
        (eventIndex - 1) % CONTINUATION_BOOK_COMPLETION_LINES.length
      ]
    : getBookCompletionOpeningLine(position);

  return [
    {
      id: `completion-${completion.id}-opening`,
      eventType: "book_completed",
      speaker: "서고지기",
      text: openingLine,
      expression: "happy",
    },
    {
      id: `completion-${completion.id}-completed`,
      eventType: "book_completed",
      speaker: "서고지기",
      text: getBookCompletionLine(position, completion.book_title),
      expression: "happy",
    },
  ];
}
