import { useEffect, useState } from "react";
import { getBooks, type Book } from "../api/books";
import BookCard from "../components/BookCard";
import { useNavigate } from "react-router-dom";

function LibraryPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("latest");
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const booksPerPage = 6;

  useEffect(() => {
    async function fetchBooks() {
      try {
        const data = await getBooks();
        setBooks(data);
      } catch (error) {
        console.error(error);
        setMessage("서고를 불러오는 중 문제가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchBooks();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortOption]);

  if (isLoading) {
    return <p>서고를 살펴보는 중...</p>;
  }

  const filteredBooks = books.filter((book) => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return (
      book.display_title.toLowerCase().includes(query) ||
      book.original_title?.toLowerCase().includes(query) ||
      book.original_filename.toLowerCase().includes(query)
    );
  });

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    if (sortOption === "title") {
      return a.display_title.localeCompare(b.display_title, "ko");
    }

    if (sortOption === "progress-desc") {
      const aProgress = a.max_read_page / a.total_pages;
      const bProgress = b.max_read_page / b.total_pages;

      return bProgress - aProgress;
    }

    if (sortOption === "progress-asc") {
      const aProgress = a.max_read_page / a.total_pages;
      const bProgress = b.max_read_page / b.total_pages;

      return aProgress - bProgress;
    }

    return b.id - a.id;
  });

  const totalPages = Math.ceil(sortedBooks.length / booksPerPage);

  const startIndex = (currentPage - 1) * booksPerPage;

  const paginatedBooks = sortedBooks.slice(
    startIndex,
    startIndex + booksPerPage,
  );

  return (
    <main>
      <h1>무림서고</h1>

      <button onClick={() => navigate("/keeper")}>
        ← 서고지기에게 돌아가기
      </button>

      <input
        type="text"
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        placeholder="비급을 찾아보세요"
      />

      <select
        value={sortOption}
        onChange={(event) => setSortOption(event.target.value)}
      >
        <option value="latest">최신 등록순</option>
        <option value="title">제목순</option>
        <option value="progress-desc">진행률 높은 순</option>
        <option value="progress-asc">진행률 낮은 순</option>
      </select>

      {message && <p>{message}</p>}

      {books.length === 0 ? (
        <p>아직 서고에 비급이 없습니다.</p>
      ) : filteredBooks.length === 0 ? (
        <p>검색 결과가 없습니다.</p>
      ) : (
        <>
          <section className="book-grid">
            {paginatedBooks.map((book) => (
              <BookCard
                id={book.id}
                displayTitle={book.display_title}
                originalTitle={book.original_title}
                originalFilename={book.original_filename}
                maxReadPage={book.max_read_page}
                totalPages={book.total_pages}
                coverStyle={book.cover_style}
                coverColor={book.cover_color}
              />
            ))}
          </section>

          <div>
            <button
              onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
              disabled={currentPage <= 1}
            >
              이전
            </button>

            <span>
              {" "}
              {currentPage} / {totalPages}{" "}
            </span>

            <button
              onClick={() =>
                setCurrentPage((page) => Math.min(page + 1, totalPages))
              }
              disabled={currentPage >= totalPages}
            >
              다음
            </button>
          </div>
        </>
      )}
    </main>
  );
}

export default LibraryPage;
