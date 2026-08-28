const API_BASE_URL = "http://127.0.0.1:8000";

export type Book = {
  id: number;
  display_title: string;
  original_title: string | null;
  source_description: string | null;
  original_filename: string;
  file_path?: string;
  title_mode: string;
  total_pages: number;
  current_page: number;
  max_read_page: number;
  cover_style: string | null;
  cover_color: string | null;
};

export async function getBooks(): Promise<Book[]> {
  const response = await fetch(`${API_BASE_URL}/books`);

  if (!response.ok) {
    throw new Error("책 목록을 불러오지 못했습니다.");
  }

  return response.json();
}

export async function getBook(bookId: string): Promise<Book> {
  const response = await fetch(`${API_BASE_URL}/books/${bookId}`);

  if (!response.ok) {
    throw new Error("책 정보를 불러오지 못했습니다.");
  }

  return response.json();
}

export async function saveBookProgress(bookId: number, currentPage: number) {
  const response = await fetch(`${API_BASE_URL}/books/${bookId}/progress`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      current_page: currentPage,
    }),
  });

  if (!response.ok) {
    throw new Error("진행도를 저장하지 못했습니다.");
  }

  return response.json();
}

export async function createBook(formData: FormData) {
  const response = await fetch(`${API_BASE_URL}/books`, {
    method: "POST",
    body: formData,
  });

  if (response.status === 409) {
    const data = await response.json();

    return {
      duplicate: true,
      existingBook: data.detail.existing_book,
    };
  }

  if (!response.ok) {
    const data = await response.json();

    const detail =
      typeof data.detail === "string" ? data.detail : "책 등록에 실패했습니다.";

    throw new Error(detail);
  }
  const data = await response.json();

  return {
    duplicate: false,
    book: data,
  };
}

export async function saveBookPosition(bookId: number, currentPage: number) {
  const response = await fetch(`${API_BASE_URL}/books/${bookId}/position`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      current_page: currentPage,
    }),
  });

  if (!response.ok) {
    throw new Error("마지막 위치를 저장하지 못했습니다.");
  }

  return response.json();
}

export async function deleteBook(bookId: number) {
  const response = await fetch(`${API_BASE_URL}/books/${bookId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("비급을 삭제하지 못했습니다.");
  }

  return response.json();
}

export async function updateBook(
  bookId: number,
  data: {
    display_title: string;
    original_title: string | null;
    cover_style: string | null;
    cover_color: string | null;
    source_description: string | null;
  },
) {
  const response = await fetch(`${API_BASE_URL}/books/${bookId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const data = await response.json();

    throw new Error(
      JSON.stringify(data.detail ?? "비급 정보를 수정하지 못했습니다."),
    );
  }

  return response.json();
}

export type TitleCandidate = {
  title: string;
  hanja: string;
  meaning: string;
  reason: string;
};

export type TitleGenerateResult = {
  valid_input: boolean;
  error_code: string | null;
  titles: TitleCandidate[];
};

export async function generateTitles(
  sourceText: string,
  sourceType: "title" | "description",
  forceGenerate = false,
): Promise<TitleGenerateResult> {
  const response = await fetch("http://127.0.0.1:8000/titles/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source_text: sourceText,
      source_type: sourceType,
      force_generate: forceGenerate,
    }),
  });

  if (!response.ok) {
    throw new Error("서고지기의 작명에 실패했습니다.");
  }

  return response.json();
}
