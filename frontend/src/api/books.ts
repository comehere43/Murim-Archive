const API_BASE_URL = "http://127.0.0.1:8000";

export type Book = {
  id: number;
  display_title: string;
  original_title: string | null;
  original_filename: string;
  file_path?: string;
  title_mode: string;
  total_pages: number;
  current_page: number;
  max_read_page: number;
  cover_style: string | null;
};

export async function getBooks(): Promise<Book[]> {
  const response = await fetch(`${API_BASE_URL}/books`);

  if (!response.ok) {
    throw new Error("책 목록을 불러오지 못했습니다.");
  }

  return response.json();
}

export async function getBook(bookId: string): Promise<Book> {
  const response = await fetch(
    `${API_BASE_URL}/books/${bookId}`,
  );

  if (!response.ok) {
    throw new Error("책 정보를 불러오지 못했습니다.");
  }

  return response.json();
}

export async function saveBookProgress(
  bookId: number,
  currentPage: number,
) {
  const response = await fetch(
    `${API_BASE_URL}/books/${bookId}/progress`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        current_page: currentPage,
      }),
    },
  );

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

  if (!response.ok) {
    throw new Error("책 등록에 실패했습니다.");
  }

  return response.json();
}

export async function saveBookPosition(
  bookId: number,
  currentPage: number,
) {
  const response = await fetch(
    `${API_BASE_URL}/books/${bookId}/position`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        current_page: currentPage,
      }),
    },
  );

  if (!response.ok) {
    throw new Error("마지막 위치를 저장하지 못했습니다.");
  }

  return response.json();
}

export async function deleteBook(bookId: number) {
  const response = await fetch(
    `${API_BASE_URL}/books/${bookId}`,
    {
      method: "DELETE",
    },
  );

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
  },
) {
  const response = await fetch(
    `${API_BASE_URL}/books/${bookId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    throw new Error("비급 정보를 수정하지 못했습니다.");
  }

  return response.json();
}