import { useNavigate } from "react-router-dom";
import { getBookRealm } from "../utils/bookProgress";

type BookCardProps = {
  id: number;
  displayTitle: string;
  originalTitle: string | null;
  originalFilename: string;
  maxReadPage: number;
  totalPages: number;
  coverStyle: string | null;
  coverColor: string | null;
};

function BookCard({
  id,
  displayTitle,
  originalTitle,
  originalFilename,
  maxReadPage,
  totalPages,
  coverStyle,
  coverColor,
}: BookCardProps) {
  const navigate = useNavigate();

  const progress =
    totalPages > 0 ? Math.round((maxReadPage / totalPages) * 100) : 0;

  const realm = getBookRealm(maxReadPage, totalPages);

  return (
    <article className="book-card" onClick={() => navigate(`/books/${id}`)}>
      <div
        className="book-cover"
        style={{
          backgroundColor: coverColor ?? "#243B6B",
        }}
      >
        <span className="book-cover-style">{coverStyle ?? "default"}</span>

        <h2>{displayTitle}</h2>
      </div>

      <div className="book-info">
        <p>
          {maxReadPage} / {totalPages} 페이지
        </p>

        <p>진행률 {progress}%</p>

        <p>경지 · {realm}</p>
      </div>

      <div className="book-original-info">
        <p>原典 · {originalTitle ?? originalFilename}</p>
      </div>
    </article>
  );
}

export default BookCard;
