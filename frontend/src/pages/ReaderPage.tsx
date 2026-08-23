import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";

import {
  getBook,
  saveBookProgress,
  saveBookPosition,
  type Book,
} from "../api/books";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";


pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();


function ReaderPage() {
  const { bookId } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(0);


  useEffect(() => {
    async function fetchBook() {
      try {
        if (!bookId) {
          throw new Error("책 ID가 없습니다.");
        }

        const data = await getBook(bookId);

        setBook(data);
        setPageNumber(data.current_page);
      } catch (error) {
        console.error(error);
        setMessage("비급을 펼치는 중 문제가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchBook();
  }, [bookId]);


  if (isLoading) {
    return <p>비급을 펼치는 중...</p>;
  }


  if (!book) {
    return <p>{message || "비급을 찾을 수 없습니다."}</p>;
  }


  const currentBookId = book.id;


  if (!book.file_path) {
    return <p>PDF 파일 경로가 없습니다.</p>;
  }


  const pdfUrl =
    `http://127.0.0.1:8000/${book.file_path.replace(/\\/g, "/")}`;


  async function saveProgress(
    bookId: number,
    page: number,
  ) {
    try {
      await saveBookProgress(bookId, page);
    } catch (error) {
      console.error(error);
    }
  }


  function goToPreviousPage() {
    const newPage = Math.max(pageNumber - 1, 1);

    setPageNumber(newPage);
    saveProgress(currentBookId, newPage);
  }


  function goToNextPage() {
    const newPage = Math.min(
      pageNumber + 1,
      numPages,
    );

    setPageNumber(newPage);
    saveProgress(currentBookId, newPage);
  }


  async function handleBack() {
    try {
      await saveBookPosition(
        currentBookId,
        pageNumber,
      );

      navigate(`/books/${currentBookId}`);
    } catch (error) {
      console.error(error);
      setMessage("마지막 위치를 저장하지 못했습니다.");
    }
  }


  return (
    <main>
      <button onClick={handleBack}>
        ← 상세페이지로
      </button>

      <h1>{book.display_title}</h1>

      {message && <p>{message}</p>}

      <div>
        <button
          onClick={goToPreviousPage}
          disabled={pageNumber <= 1}
        >
          이전 장
        </button>

        <span>
          {" "}
          {pageNumber} / {numPages || book.total_pages}
          {" "}
        </span>

        <button
          onClick={goToNextPage}
          disabled={pageNumber >= numPages}
        >
          다음 장
        </button>
      </div>

      <Document
        file={pdfUrl}
        onLoadSuccess={({ numPages }) => {
          setNumPages(numPages);
        }}
        loading={<p>비급의 장을 펼치는 중...</p>}
        error={<p>PDF를 불러오지 못했습니다.</p>}
      >
        <Page
          pageNumber={pageNumber}
          width={800}
        />
      </Document>
    </main>
  );
}


export default ReaderPage;