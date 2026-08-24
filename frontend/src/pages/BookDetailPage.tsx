import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { deleteBook, getBook, type Book } from "../api/books";

function BookDetailPage() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function fetchBook() {
      try {
        if (!bookId) {
          throw new Error("책 ID가 없습니다.");
        }

        const data = await getBook(bookId);
        setBook(data);
      } catch (error) {
        console.error(error);
        setMessage("비급 정보를 불러오는 중 문제가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchBook();
  }, [bookId]);

  if (isLoading) {
    return <p>비급을 살펴보는 중...</p>;
  }

  if (!book) {
    return <p>{message || "존재하지 않는 비급입니다."}</p>;
  }

  const currentBookId = book.id;

  const progress =
    book.total_pages > 0
      ? Math.round((book.max_read_page / book.total_pages) * 100)
      : 0;

  async function handleDelete() {
    const confirmed = window.confirm("이 비급을 서고에서 삭제하시겠습니까?");

    if (!confirmed) {
      return;
    }

    try {
      await deleteBook(currentBookId);
      navigate("/library");
    } catch (error) {
      console.error(error);
      setMessage("비급을 삭제하지 못했습니다.");
    }
  }

  return (
    <main>
      <button onClick={() => navigate("/library")}>← 서고로 돌아가기</button>

      <h1>{book.display_title}</h1>

      <p>原典 · {book.original_title ?? book.original_filename}</p>

      <p>
        마지막 위치: {book.current_page} / {book.total_pages} 페이지
      </p>

      <p>
        진행률 {progress}% · {book.max_read_page} / {book.total_pages} 페이지
      </p>

      <button onClick={() => navigate(`/reader/${book.id}`)}>
        비급 펼치기
      </button>

      <button onClick={() => navigate(`/books/${book.id}/edit`)}>
        비급 정보 수정
      </button>

      <button onClick={handleDelete}>비급 삭제</button>
    </main>
  );
}

export default BookDetailPage;
