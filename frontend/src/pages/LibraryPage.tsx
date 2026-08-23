import { useEffect, useState } from "react";
import { getBooks, type Book } from "../api/books";
import BookCard from "../components/BookCard";



function LibraryPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

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

  if (isLoading) {
    return <p>서고를 살펴보는 중...</p>;
  }

  return (
    <main>
      <h1>무림서고</h1>

      {message && <p>{message}</p>}

      {books.length === 0 ? (
        <p>아직 서고에 비급이 없습니다.</p>
      ) : (
        <section className="book-grid">
          {books.map((book) => (
            <BookCard
              key={book.id}
              id={book.id}
              displayTitle={book.display_title}
              originalTitle={book.original_title}
              originalFilename={book.original_filename}
              currentPage={book.current_page}
              maxReadPage={book.max_read_page}
              totalPages={book.total_pages}
              coverStyle={book.cover_style}
            />
          ))}
        </section>
      )}
    </main>
  );
}

export default LibraryPage;