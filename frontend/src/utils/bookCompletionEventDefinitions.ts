export function getBookCompletionOpeningLine(position: string) {
  return `${position}님, 기쁜 소식이 있사옵니다.`;
}

export function getBookCompletionLine(position: string, bookTitle: string) {
  return `${position}님께서 「${bookTitle}」을 끝내 온전히 익히셨사옵니다.`;
}

export const CONTINUATION_BOOK_COMPLETION_LINES = [
  "또 한 권의 비급에서도 성취를 이루셨사옵니다.",
  "수련의 성과가 여기서 그치지 않았사옵니다.",
  "이어서 또 하나의 비급을 완성하셨사옵니다.",
];
