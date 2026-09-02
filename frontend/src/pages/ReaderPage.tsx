import { useEffect, useRef, useState } from "react";
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

const JUMP_PROMPT_AFTER_PAGES = 3;

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

  // 실제 진행률 계산에 사용되는 페이지
  const [progressPage, setProgressPage] = useState(1);

  // 점프 이후 자동 진행률 갱신을 잠시 멈추는 상태
  const [isProgressPaused, setIsProgressPaused] = useState(false);

  // 점프한 뒤 앞으로 몇 페이지를 순차적으로 읽었는지
  const [pagesReadAfterJump, setPagesReadAfterJump] = useState(0);

  // 점프 이후 진도를 어떻게 처리할지 묻는 안내창
  const [showProgressPrompt, setShowProgressPrompt] = useState(false);

  // 현재 점프 구간에서 사용자가 "기존 진도 유지"를 선택했는지
  const [promptDismissedForJump, setPromptDismissedForJump] = useState(false);

  const latestPageRef = useRef(1);
  const positionSavedRef = useRef(false);

  const progressTimerRef = useRef<number | null>(null);
  const pendingProgressPageRef = useRef<number | null>(null);

  useEffect(() => {
    async function fetchBook() {
      try {
        if (!bookId) {
          throw new Error("책 ID가 없습니다.");
        }

        const data = await getBook(bookId);

        setBook(data);
        setPageNumber(data.current_page);
        setProgressPage(data.progress_page);

        latestPageRef.current = data.current_page;
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

      // 아직 저장 대기 중인 진행률이 있다면
      // Reader를 나갈 때 즉시 저장한다.
      if (progressTimerRef.current !== null) {
        window.clearTimeout(progressTimerRef.current);
        progressTimerRef.current = null;
      }

      const pendingPage = pendingProgressPageRef.current;

      if (pendingPage !== null) {
        saveBookProgress(book.id, pendingPage).catch((error) => {
          console.error(error);
        });

        pendingProgressPageRef.current = null;
      }

      // 상세페이지 버튼에서 이미 현재 위치를 저장했다면
      // 중복 저장하지 않는다.
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
        goToPreviousPage();
      }

      if (event.key === "ArrowRight") {
        goToNextPage();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  });

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

  /**
   * 진행률 자동 저장.
   *
   * 다음 장을 계속 넘길 때 서버 요청이 너무 자주 발생하지 않도록
   * 300ms 동안 마지막 값만 모아서 저장한다.
   */
  function queueProgressSave(bookId: number, page: number) {
    pendingProgressPageRef.current = page;

    if (progressTimerRef.current !== null) {
      window.clearTimeout(progressTimerRef.current);
    }

    progressTimerRef.current = window.setTimeout(async () => {
      const pendingPage = pendingProgressPageRef.current;

      if (pendingPage === null) {
        return;
      }

      try {
        await saveBookProgress(bookId, pendingPage);

        pendingProgressPageRef.current = null;
        progressTimerRef.current = null;
      } catch (error) {
        console.error(error);
      }
    }, 300);
  }

  /**
   * 점프 상태를 해제한다.
   */
  function clearJumpState() {
    setIsProgressPaused(false);
    setPagesReadAfterJump(0);
    setShowProgressPrompt(false);
    setPromptDismissedForJump(false);
  }

  /**
   * 이전 장
   *
   * 뒤로 돌아가는 것은 진행률을 낮추지 않는다.
   */
  function goToPreviousPage() {
    const newPage = Math.max(pageNumber - 1, 1);

    setPageNumber(newPage);

    // 점프 이후 기존에 읽은 영역까지 돌아왔다면
    // 더 이상 진도 보류 상태일 필요가 없다.
    if (isProgressPaused && newPage <= progressPage) {
      clearJumpState();
    }
  }

  /**
   * 다음 장
   *
   * 일반 독서 상태:
   *   current_page와 progress_page가 함께 진행
   *
   * 점프 이후:
   *   현재 페이지만 이동하고 진행률은 잠시 유지
   */
  function goToNextPage() {
    const newPage = Math.min(pageNumber + 1, numPages);

    if (newPage === pageNumber) {
      return;
    }

    setPageNumber(newPage);

    if (isProgressPaused) {
      const nextReadCount = pagesReadAfterJump + 1;

      setPagesReadAfterJump(nextReadCount);

      if (
        nextReadCount >= JUMP_PROMPT_AFTER_PAGES &&
        !promptDismissedForJump &&
        !showProgressPrompt
      ) {
        setShowProgressPrompt(true);
      }

      return;
    }

    // 이미 인정된 진도보다 앞으로 읽었을 때만 진행률을 올린다.
    if (newPage > progressPage) {
      setProgressPage(newPage);
      queueProgressSave(currentBookId, newPage);
    }
  }

  /**
   * 페이지 번호 직접 입력
   *
   * 이것은 순차 독서가 아니라 "점프"로 취급한다.
   */
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

    // 현재 인정된 진도보다 뒤쪽으로 점프한 경우
    if (targetPage > progressPage) {
      setIsProgressPaused(true);
      setPagesReadAfterJump(0);
      setShowProgressPrompt(false);
      setPromptDismissedForJump(false);
    } else {
      // 이미 읽은 범위 안으로 이동했다면 점프 보류가 필요 없다.
      clearJumpState();
    }
  }

  /**
   * 사용자가 현재 위치까지 실제 진도로 인정한다.
   *
   * 점프 구간을 의도적으로 건너뛴 경우 사용하는 기능.
   */
  async function recordProgressToCurrentPage() {
    if (pageNumber <= progressPage) {
      clearJumpState();
      return;
    }

    try {
      // 대기 중이던 자동 저장이 있다면 먼저 제거한다.
      if (progressTimerRef.current !== null) {
        window.clearTimeout(progressTimerRef.current);
        progressTimerRef.current = null;
      }

      pendingProgressPageRef.current = null;

      await saveBookProgress(currentBookId, pageNumber);

      setProgressPage(pageNumber);
      clearJumpState();
      setMessage("현재 위치까지 수련 진도로 기록했습니다.");
    } catch (error) {
      console.error(error);
      setMessage("수련 진도를 저장하지 못했습니다.");
    }
  }

  /**
   * 점프 이후 안내창에서 기존 진행률을 유지하기로 선택.
   *
   * 현재 점프 세션에서는 같은 안내창을 다시 띄우지 않는다.
   */
  function keepExistingProgress() {
    setShowProgressPrompt(false);
    setPromptDismissedForJump(true);
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
      if (progressTimerRef.current !== null) {
        window.clearTimeout(progressTimerRef.current);
        progressTimerRef.current = null;
      }

      const pendingPage = pendingProgressPageRef.current;

      if (pendingPage !== null) {
        await saveBookProgress(currentBookId, pendingPage);
        pendingProgressPageRef.current = null;
      }

      await saveBookPosition(currentBookId, pageNumber);

      positionSavedRef.current = true;

      navigate(`/books/${currentBookId}`);
    } catch (error) {
      console.error(error);
      setMessage("마지막 읽기 정보를 저장하지 못했습니다.");
    }
  }

  return (
    <main>
      <button onClick={handleBack}>← 상세페이지로</button>

      <h1>{book.display_title}</h1>

      {message && <p>{message}</p>}

      <p>
        수련 기록: {progressPage} / {numPages || book.total_pages}
      </p>

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

      {isProgressPaused && pageNumber > progressPage && (
        <div>
          <p>현재 수련 기록은 {progressPage}쪽까지입니다.</p>

          <button onClick={recordProgressToCurrentPage}>
            이 지점까지 수련한 것으로 기록
          </button>
        </div>
      )}

      {showProgressPrompt && (
        <div className="progress-modal-backdrop">
          <div
            className="progress-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="progress-modal-title"
          >
            <h2 id="progress-modal-title">수련 진도를 확인합니다</h2>

            <p>
              기존 수련 기록은 <strong>{progressPage}쪽</strong>까지입니다.
            </p>

            <p>
              현재 <strong>{pageNumber}쪽</strong>에서 수련을 이어가고 있습니다.
            </p>

            <p>
              건너뛴 구간을 포함하여 현재 위치까지 수련한 것으로
              기록하시겠습니까?
            </p>

            <div className="progress-modal-actions">
              <button onClick={recordProgressToCurrentPage}>
                현재 위치까지 기록
              </button>

              <button onClick={keepExistingProgress}>기존 진도 유지</button>
            </div>
          </div>
        </div>
      )}

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
