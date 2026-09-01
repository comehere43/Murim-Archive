import { API_BASE_URL } from "../config";

export type BookCompletionEvent = {
  id: number;
  book_id: number;
  book_title: string;
  acquired_at: string;
  is_seen: boolean;
};

export async function getUnseenBookCompletionEvents(): Promise<
  BookCompletionEvent[]
> {
  const response = await fetch(`${API_BASE_URL}/profile/completions/unseen`);

  if (!response.ok) {
    throw new Error("완독 정보를 불러오지 못했습니다.");
  }

  return response.json();
}

export async function markBookCompletionEventAsSeen(
  bookId: number,
): Promise<BookCompletionEvent> {
  const response = await fetch(
    `${API_BASE_URL}/profile/completions/${bookId}/seen`,
    {
      method: "PATCH",
    },
  );

  if (!response.ok) {
    throw new Error("완독 확인 처리를 완료하지 못했습니다.");
  }

  return response.json();
}
