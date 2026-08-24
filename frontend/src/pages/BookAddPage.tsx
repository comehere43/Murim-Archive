import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createBook, generateTitles, type TitleCandidate } from "../api/books";

function BookAddPage() {
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [titleMode, setTitleMode] = useState<"manual" | "ai" | null>(null);
  const [displayTitle, setDisplayTitle] = useState("");
  const [originalTitle, setOriginalTitle] = useState("");
  const [aiCandidates, setAiCandidates] = useState<TitleCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [duplicateBook, setDuplicateBook] = useState<{
    id: number;
    display_title: string;
    original_title: string | null;
  } | null>(null);

  async function handleGenerateNames() {
    if (!originalTitle.trim()) {
      setMessage("원전의 이름을 입력해주십시오.");
      return;
    }

    try {
      setMessage("서고지기가 비급명을 고민하고 있습니다...");

      const candidates = await generateTitles(originalTitle.trim());

      setAiCandidates(candidates);
      setSelectedCandidate("");
      setDisplayTitle("");
      setMessage("");
    } catch (error) {
      console.error(error);
      setMessage("서고지기의 작명 중 문제가 발생했습니다.");
    }
  }

  async function handleSubmit() {
    if (!file) {
      setMessage("PDF를 선택해주십시오.");
      return;
    }

    if (!titleMode) {
      setMessage("비급명 결정 방식을 선택해주십시오.");
      return;
    }

    if (!displayTitle.trim()) {
      setMessage("비급명을 입력하거나 선택해주십시오.");
      return;
    }

    const formData = new FormData();

    formData.append("file", file);
    formData.append("display_title", displayTitle);
    formData.append("title_mode", titleMode);

    if (titleMode === "ai" && originalTitle.trim()) {
      formData.append("original_title", originalTitle.trim());
    }
    formData.append("cover_style", "navy");

    setIsSubmitting(true);
    setMessage("비급을 서고에 등록하고 있습니다...");

    try {
      const result = await createBook(formData);

      if (result.duplicate) {
        setDuplicateBook(result.existingBook);
        setMessage("같은 PDF가 이미 서고에 있습니다.");
        return;
      }

      setDuplicateBook(null);
      setMessage(
        `「${result.book.display_title}」이(가) 서고에 등록되었습니다.`,
      );
      setIsSuccess(true);
    } catch (error) {
      console.error(error);
      setMessage("비급 등록 중 문제가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main>
      <h1>새 비급 등록</h1>

      <section>
        <h2>비급을 선택하십시오</h2>

        <input
          type="file"
          accept="application/pdf"
          onChange={(event) => {
            const selectedFile = event.target.files?.[0] ?? null;
            setFile(selectedFile);
          }}
        />

        {file && <p>선택한 문서: {file.name}</p>}
      </section>

      <section>
        <h2>비급명을 어떻게 정하시겠습니까?</h2>

        <button onClick={() => setTitleMode("manual")}>내가 직접 짓기</button>

        <button onClick={() => setTitleMode("ai")}>서고지기에게 맡기기</button>
      </section>

      {titleMode === "manual" && (
        <section>
          <h2>비급명을 적어주십시오</h2>

          <input
            type="text"
            value={displayTitle}
            onChange={(event) => setDisplayTitle(event.target.value)}
            placeholder="예: 전서천서록"
          />

          <button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "등록 중..." : "서고에 등록"}
          </button>
        </section>
      )}

      {titleMode === "ai" && (
        <section>
          <h2>원전의 이름을 알려주십시오</h2>

          <input
            type="text"
            value={originalTitle}
            onChange={(event) => setOriginalTitle(event.target.value)}
            placeholder="예: Hands-On Machine Learning"
          />

          <button onClick={handleGenerateNames}>서고지기에게 작명 요청</button>

          {aiCandidates.length > 0 && (
            <div>
              <h3>서고지기의 추천</h3>

              {aiCandidates.map((candidate) => (
                <div key={candidate.title}>
                  <h4>
                    {candidate.title} · {candidate.hanja}
                  </h4>

                  <p>{candidate.meaning}</p>
                  <p>{candidate.reason}</p>

                  <button
                    onClick={() => {
                      setSelectedCandidate(candidate.title);
                      setDisplayTitle(candidate.title);
                    }}
                  >
                    이 이름 선택
                  </button>
                </div>
              ))}

              {selectedCandidate && (
                <div>
                  <h3>선택한 비급명</h3>

                  <input
                    type="text"
                    value={displayTitle}
                    onChange={(event) => setDisplayTitle(event.target.value)}
                  />

                  <button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? "등록 중..." : "서고에 등록"}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {message && <p>{message}</p>}

      {duplicateBook && (
        <section>
          <h2>이미 같은 문서가 있습니다</h2>

          <p>기존 비급: {duplicateBook.display_title}</p>

          <button onClick={() => navigate(`/books/${duplicateBook.id}`)}>
            기존 비급 보기
          </button>

          <button
            onClick={async () => {
              if (!file || !titleMode || !displayTitle.trim()) {
                return;
              }

              const formData = new FormData();

              formData.append("file", file);
              formData.append("display_title", displayTitle);
              formData.append("title_mode", titleMode);
              formData.append("cover_style", "navy");
              formData.append("force_duplicate", "true");

              if (titleMode === "ai" && originalTitle.trim()) {
                formData.append("original_title", originalTitle.trim());
              }

              try {
                setIsSubmitting(true);

                const result = await createBook(formData);

                if (!result.duplicate) {
                  setDuplicateBook(null);
                  setMessage(
                    `「${result.book.display_title}」이(가) 서고에 등록되었습니다.`,
                  );
                  setIsSuccess(true);
                }
              } catch (error) {
                console.error(error);
                setMessage("비급 등록 중 문제가 발생했습니다.");
              } finally {
                setIsSubmitting(false);
              }
            }}
            disabled={isSubmitting}
          >
            그래도 새 비급으로 등록
          </button>
        </section>
      )}

      {isSuccess && (
        <button onClick={() => navigate("/keeper")}>뒤로가기</button>
      )}
    </main>
  );
}

export default BookAddPage;
