export type TitleDefinition = {
  key: string;
  name: string;
  description: string;
  rumor: (position: string) => string;
};

export const TITLE_DEFINITIONS: Record<string, TitleDefinition> = {
  book_collector: {
    key: "book_collector",
    name: "비급수집가",
    description: "수많은 비급을 모아 서고를 채운 자에게 붙는 칭호입니다.",
    rumor: (position) =>
      `${position}님께서 모으신 비급이 강호에서도 화제가 되고 있다 하옵니다.`,
  },

  book_sage: {
    key: "book_sage",
    name: "서존",
    description: "방대한 글을 읽고 익힌 자에게 붙는 존호입니다.",
    rumor: (position) =>
      `${position}님의 학식이 널리 알려져 강호의 학인들이 경외하기 시작했다 하옵니다.`,
  },

  reading_master: {
    key: "reading_master",
    name: "독존",
    description: "수많은 비급을 끝까지 탐독한 자에게 붙는 존호입니다.",
    rumor: (position) =>
      `${position}님께서 수많은 비급을 끝까지 탐독하셨다는 이야기가 강호에 퍼지고 있다 하옵니다.`,
  },

  ten_thousand_library: {
    key: "ten_thousand_library",
    name: "만권서고주",
    description: "거대한 서고를 일군 자에게 붙는 칭호입니다.",
    rumor: (position) =>
      `${position}님의 서고가 천하의 비급을 품은 곳이라 소문이 자자하다 하옵니다.`,
  },

  murim_leader: {
    key: "murim_leader",
    name: "무림맹주",
    description: "강호에서 최고의 명망을 얻은 자에게 붙는 칭호입니다.",
    rumor: (position) =>
      `${position}님의 이름이 강호 곳곳에 퍼져 많은 이들이 우러러보고 있다 하옵니다.`,
  },
};

export function getFirstTitleEventLine(position: string) {
  return `${position}님! 강호에 새로운 소문이 돌고 있사옵니다.`;
}

export const CONTINUATION_TITLE_EVENT_LINES = [
  "또 하나 전할 소식이 있사옵니다.",
  "이뿐만이 아니옵니다.",
  "강호의 소문은 여기서 그치지 않았사옵니다.",
  "게다가 또 다른 이야기가 들려오고 있사옵니다.",
];

export function getTitleAcquiredLine(titleKey: string, position: string) {
  const definition = TITLE_DEFINITIONS[titleKey];

  if (!definition) {
    return `${position}님께 새로운 칭호가 생겼사옵니다.`;
  }

  return `이제 강호에서는 ${position}님을 「${definition.name}」이라 부른다고 하옵니다!`;
}
