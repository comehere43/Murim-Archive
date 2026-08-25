import { useEffect, useState, type SyntheticEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getBook, updateBook, type Book } from "../api/books";

const COVER_PRESETS = [
  { key: "navy", name: "청람", color: "#243B6B" },
  { key: "red", name: "적운", color: "#7A2E2E" },
  { key: "black", name: "묵야", color: "#1F1F22" },
  { key: "parchment", name: "고죽", color: "#8A6A43" },
  { key: "jade", name: "옥빛", color: "#52796F" },
  { key: "purple", name: "자운", color: "#62466B" },
  { key: "white", name: "설백", color: "#E7E3DA" },
  { key: "earth", name: "황토", color: "#9A6B3F" },
];

function BookEditPage() {
  const { bookId } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState<Book | null>(null);

  const [displayTitle, setDisplayTitle] = useState("");
  const [originalTitle, setOriginalTitle] = useState("");
  const [sourceDescription, setSourceDescription] = useState("");

  const [sourceType, setSourceType] = useState<"title" | "description">(
    "title",
  );

  const [coverStyle, setCoverStyle] = useState("");
  const [coverColor, setCoverColor] = useState("#243B6B");

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
        setSourceDescription(data.source_description ?? "");
        setCoverStyle(data.cover_style ?? "");
        setCoverColor(data.cover_color ?? "#243B6B");

        if (data.source_description) {
          setSourceType("description");
        } else {
          setSourceType("title");
        }
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

        original_title:
          sourceType === "title" ? originalTitle.trim() || null : null,

        source_description:
          sourceType === "description"
            ? sourceDescription.trim() || null
            : null,

        cover_style: coverStyle.trim() || null,
        cover_color: coverColor,
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

        {book.title_mode === "ai" && (
          <div>
            <p>작명에 사용한 정보</p>

            <button
              type="button"
              onClick={() => {
                setSourceType("title");
                setSourceDescription("");
              }}
            >
              원전 제목
            </button>

            <button
              type="button"
              onClick={() => {
                setSourceType("description");
                setOriginalTitle("");
              }}
            >
              내용 설명
            </button>

            {sourceType === "title" && (
              <div>
                <label htmlFor="originalTitle">원전 제목</label>

                <input
                  id="originalTitle"
                  type="text"
                  value={originalTitle}
                  onChange={(event) => setOriginalTitle(event.target.value)}
                  placeholder="예: Hands-On Machine Learning"
                />
              </div>
            )}

            {sourceType === "description" && (
              <div>
                <label htmlFor="sourceDescription">내용 설명</label>

                <input
                  id="sourceDescription"
                  type="text"
                  value={sourceDescription}
                  onChange={(event) => setSourceDescription(event.target.value)}
                  placeholder="예: 머신러닝 알고리즘과 신경망을 다루는 교재"
                />
              </div>
            )}
          </div>
        )}

        <div>
          <p>표지의 빛깔</p>

          <div>
            {COVER_PRESETS.map((preset) => (
              <button
                key={preset.key}
                type="button"
                onClick={() => {
                  setCoverStyle(preset.key);
                  setCoverColor(preset.color);
                }}
                disabled={coverStyle === preset.key}
              >
                {preset.name}
              </button>
            ))}
          </div>

          <div>
            <p>직접 고르기</p>

            <input
              type="color"
              value={coverColor}
              onChange={(event) => {
                setCoverStyle("custom");
                setCoverColor(event.target.value);
              }}
            />

            <span>{coverColor}</span>
          </div>
        </div>

        <button type="submit" disabled={isSaving}>
          {isSaving ? "수정 중..." : "수정 완료"}
        </button>
      </form>
    </main>
  );
}

export default BookEditPage;
