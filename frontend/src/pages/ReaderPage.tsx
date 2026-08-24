import { useEffect, useState, useRef } from "react";
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
  const [pageInput, setPageInput] = useState("");
  const [pageWidth, setPageWidth] = useState(800);

  const latestPageRef = useRef(1);
  const positionSavedRef = useRef(false);
  const progressTimerRef = useRef<number | null>(null);

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

  useEffect(() => {
    latestPageRef.current = pageNumber;
  }, [pageNumber]);

  useEffect(() => {
    return () => {
      if (!book) {
        return;
      }

      if (positionSavedRef.current) {
        return;
      }

      saveBookPosition(book.id, latestPageRef.current).catch((error) => {
        console.error(error);
      });
    };
  }, [book]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement;

      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        return;
      }

      if (!book || numPages === 0) {
        return;
      }

      if (event.key === "ArrowLeft") {
        const newPage = Math.max(pageNumber - 1, 1);

        setPageNumber(newPage);
        saveBookProgress(book.id, newPage).catch((error) => {
          console.error(error);
        });
      }

      if (event.key === "ArrowRight") {
        const newPage = Math.min(pageNumber + 1, numPages);

        setPageNumber(newPage);
        saveBookProgress(book.id, newPage).catch((error) => {
          console.error(error);
        });
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [book, pageNumber, numPages]);

  useEffect(() => {
    return () => {
      if (progressTimerRef.current !== null) {
        window.clearTimeout(progressTimerRef.current);
      }
    };
  }, []);

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

  const pdfUrl = `http://127.0.0.1:8000/${book.file_path.replace(/\\/g, "/")}`;

  function saveProgress(bookId: number, page: number) {
    if (progressTimerRef.current !== null) {
      window.clearTimeout(progressTimerRef.current);
    }

    progressTimerRef.current = window.setTimeout(async () => {
      try {
        await saveBookProgress(bookId, page);
      } catch (error) {
        console.error(error);
      }
    }, 300);
  }

  function goToPreviousPage() {
    const newPage = Math.max(pageNumber - 1, 1);

    setPageNumber(newPage);
    saveProgress(currentBookId, newPage);
  }

  function goToNextPage() {
    const newPage = Math.min(pageNumber + 1, numPages);

    setPageNumber(newPage);
    saveProgress(currentBookId, newPage);
  }

  function goToPage() {
    const targetPage = Number(pageInput);

    if (!Number.isInteger(targetPage)) {
      setMessage("페이지 번호를 숫자로 입력해주세요.");
      return;
    }

    if (targetPage < 1 || targetPage > numPages) {
      setMessage(`1부터 ${numPages} 사이의 페이지를 입력해주세요.`);
      return;
    }

    setPageNumber(targetPage);
    setPageInput("");
    setMessage("");

    saveProgress(currentBookId, targetPage);
  }

  function zoomIn() {
    setPageWidth((width) => Math.min(width + 100, 1600));
  }

  function zoomOut() {
    setPageWidth((width) => Math.max(width - 100, 400));
  }

  function fitToWidth() {
    const availableWidth = Math.min(window.innerWidth - 80, 1000);
    setPageWidth(Math.max(400, availableWidth));
  }

  async function handleBack() {
    try {
      await saveBookPosition(currentBookId, pageNumber);

      positionSavedRef.current = true;

      navigate(`/books/${currentBookId}`);
    } catch (error) {
      console.error(error);
      setMessage("마지막 위치를 저장하지 못했습니다.");
    }
  }

  return (
    <main>
      <button onClick={handleBack}>← 상세페이지로</button>

      <h1>{book.display_title}</h1>

      {message && <p>{message}</p>}

      <div>
        <button onClick={goToPreviousPage} disabled={pageNumber <= 1}>
          이전 장
        </button>

        <span>
          {" "}
          {pageNumber} / {numPages || book.total_pages}{" "}
        </span>

        <button onClick={goToNextPage} disabled={pageNumber >= numPages}>
          다음 장
        </button>
      </div>

      <div>
        <input
          type="number"
          min="1"
          max={numPages || book.total_pages}
          value={pageInput}
          onChange={(event) => setPageInput(event.target.value)}
          placeholder="페이지"
        />

        <button onClick={goToPage}>이동</button>
      </div>

      <div>
        <button onClick={zoomOut}>축소</button>

        <span> {Math.round((pageWidth / 800) * 100)}% </span>

        <button onClick={zoomIn}>확대</button>

        <button onClick={fitToWidth}>화면 맞춤</button>
      </div>

      <Document
        file={pdfUrl}
        onLoadSuccess={({ numPages }) => {
          setNumPages(numPages);
        }}
        loading={<p>비급의 장을 펼치는 중...</p>}
        error={<p>PDF를 불러오지 못했습니다.</p>}
      >
        <Page pageNumber={pageNumber} width={pageWidth} />
      </Document>
    </main>
  );
}

export default ReaderPage;
