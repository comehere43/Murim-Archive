import { useEffect, useState, type SyntheticEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getBook, updateBook, type Book } from "../api/books";

function BookEditPage() {
  const { bookId } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState<Book | null>(null);
  const [displayTitle, setDisplayTitle] = useState("");
  const [originalTitle, setOriginalTitle] = useState("");
  const [coverStyle, setCoverStyle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function fetchBook() {
      try {
        if (!bookId) {
          throw new Error("책 ID가 없습니다.");
        }

        const data = await getBook(bookId);

        setBook(data);
        setDisplayTitle(data.display_title);
        setOriginalTitle(data.original_title ?? "");
        setCoverStyle(data.cover_style ?? "");
      } catch (error) {
        console.error(error);
        setMessage("비급 정보를 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchBook();
  }, [bookId]);

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!book) {
      return;
    }

    if (!displayTitle.trim()) {
      setMessage("비급명을 입력해주세요.");
      return;
    }

    try {
      setIsSaving(true);
      setMessage("");

      await updateBook(book.id, {
        display_title: displayTitle.trim(),
        original_title: originalTitle.trim() || null,
        cover_style: coverStyle.trim() || null,
      });

      navigate(`/books/${book.id}`);
    } catch (error) {
      console.error(error);
      setMessage("비급 정보를 수정하지 못했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <p>비급 정보를 불러오는 중...</p>;
  }

  if (!book) {
    return <p>{message || "존재하지 않는 비급입니다."}</p>;
  }

  return (
    <main>
      <button onClick={() => navigate(`/books/${book.id}`)}>← 수정 취소</button>

      <h1>비급 정보 수정</h1>

      {message && <p>{message}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="displayTitle">비급명</label>

          <input
            id="displayTitle"
            type="text"
            value={displayTitle}
            onChange={(event) => setDisplayTitle(event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="originalTitle">원전 제목</label>

          <input
            id="originalTitle"
            type="text"
            value={originalTitle}
            onChange={(event) => setOriginalTitle(event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="coverStyle">표지 스타일</label>

          <input
            id="coverStyle"
            type="text"
            value={coverStyle}
            onChange={(event) => setCoverStyle(event.target.value)}
          />
        </div>

        <button type="submit" disabled={isSaving}>
          {isSaving ? "수정 중..." : "수정 완료"}
        </button>
      </form>
    </main>
  );
}

export default BookEditPage;
