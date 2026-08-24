import { useNavigate } from "react-router-dom";

type BookCardProps = {
  id: number;
  displayTitle: string;
  originalTitle: string | null;
  originalFilename: string;
  currentPage: number;
  maxReadPage: number;
  totalPages: number;
  coverStyle: string | null;
};

function BookCard({
  id,
  displayTitle,
  originalTitle,
  originalFilename,
  currentPage,
  maxReadPage,
  totalPages,
  coverStyle,
}: BookCardProps) {
  const navigate = useNavigate();

  const progress =
    totalPages > 0 ? Math.round((maxReadPage / totalPages) * 100) : 0;

  return (
    <article className="book-card" onClick={() => navigate(`/books/${id}`)}>
      <div className="book-cover">
        <span className="book-cover-style">{coverStyle ?? "default"}</span>

        <h2>{displayTitle}</h2>
      </div>

      <div className="book-info">
        <p>
          {maxReadPage} / {totalPages} 페이지
        </p>

        <p>진행률 {progress}%</p>
      </div>

      <div className="book-original-info">
        <p>原典 · {originalTitle ?? originalFilename}</p>
      </div>
    </article>
  );
}

export default BookCard;
