import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createBook, generateTitles, type TitleCandidate } from "../api/books";

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

function BookAddPage() {
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [titleMode, setTitleMode] = useState<"manual" | "ai" | null>(null);
  const [displayTitle, setDisplayTitle] = useState("");
  const [originalTitle, setOriginalTitle] = useState("");
  const [sourceType, setSourceType] = useState<"title" | "description">(
    "title",
  );
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
  const [isGeneratingTitles, setIsGeneratingTitles] = useState(false);
  const [canForceGenerate, setCanForceGenerate] = useState(false);
  const [coverStyle, setCoverStyle] = useState("navy");
  const [coverColor, setCoverColor] = useState("#243B6B");

  async function handleGenerateNames() {
    if (!originalTitle.trim()) {
      setMessage("원전의 이름을 입력해주십시오.");
      return;
    }

    try {
      setIsGeneratingTitles(true);
      setMessage("서고지기가 비급명을 고민하고 있습니다...");

      const result = await generateTitles(originalTitle.trim(), sourceType);

      if (!result.valid_input) {
        setAiCandidates([]);
        setSelectedCandidate("");
        setDisplayTitle("");

        if (result.error_code === "INVALID_INPUT" && sourceType === "title") {
          setMessage(
            "원전의 의미를 파악하기 어렵습니다. 원전의 의미와 무관하게 자유롭게 작명할 수 있습니다.",
          );
          setCanForceGenerate(true);
        } else {
          setMessage(
            sourceType === "title"
              ? "원전의 의미를 파악하기 어렵습니다."
              : "설명만으로는 비급의 내용을 파악하기 어렵습니다.",
          );
          setCanForceGenerate(false);
        }

        return;
      }

      setAiCandidates(result.titles);
      setSelectedCandidate("");
      setDisplayTitle("");
      setMessage("");
      setCanForceGenerate(false);
    } catch (error) {
      console.error(error);
      setMessage("서고지기의 작명 중 문제가 발생했습니다.");
    } finally {
      setIsGeneratingTitles(false);
    }
  }

  async function handleForceGenerate() {
    if (!originalTitle.trim()) {
      return;
    }

    try {
      setIsGeneratingTitles(true);
      setMessage("서고지기가 자유롭게 비급명을 짓고 있습니다...");

      const result = await generateTitles(originalTitle.trim(), "title", true);

      setAiCandidates(result.titles);
      setSelectedCandidate("");
      setDisplayTitle("");
      setCanForceGenerate(false);
      setMessage("");
    } catch (error) {
      console.error(error);
      setMessage("서고지기의 작명 중 문제가 발생했습니다.");
    } finally {
      setIsGeneratingTitles(false);
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

    if (titleMode === "ai" && sourceType === "title" && originalTitle.trim()) {
      formData.append("original_title", originalTitle.trim());
    }

    if (
      titleMode === "ai" &&
      sourceType === "description" &&
      originalTitle.trim()
    ) {
      formData.append("source_description", originalTitle.trim());
    }

    formData.append("cover_style", coverStyle);
    formData.append("cover_color", coverColor);

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
      <button onClick={() => navigate("/library")}>← 서고로 돌아가기</button>

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

      <section>
        <h2>표지의 빛깔을 고르십시오</h2>

        <div>
          {COVER_PRESETS.map((preset) => (
            <button
              key={preset.key}
              type="button"
              onClick={() => {
                setCoverStyle(preset.key);
                setCoverColor(preset.color);
              }}
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
          <h2>서고지기에게 무엇을 알려주시겠습니까?</h2>

          <div>
            <button
              onClick={() => {
                setSourceType("title");
                setOriginalTitle("");
                setAiCandidates([]);
                setSelectedCandidate("");
                setDisplayTitle("");
                setCanForceGenerate(false);
                setMessage("");
              }}
            >
              원전 제목
            </button>

            <button
              onClick={() => {
                setSourceType("description");
                setOriginalTitle("");
                setAiCandidates([]);
                setSelectedCandidate("");
                setDisplayTitle("");
                setCanForceGenerate(false);
                setMessage("");
              }}
            >
              내용 설명
            </button>
          </div>

          <input
            type="text"
            value={originalTitle}
            onChange={(event) => setOriginalTitle(event.target.value)}
            placeholder={
              sourceType === "title"
                ? "예: Hands-On Machine Learning"
                : "예: 머신러닝 알고리즘과 신경망을 다루는 교재"
            }
          />

          <button onClick={handleGenerateNames} disabled={isGeneratingTitles}>
            {isGeneratingTitles
              ? "서고지기가 고민 중..."
              : aiCandidates.length > 0
                ? "다시 추천받기"
                : "서고지기에게 작명 요청"}
          </button>

          {canForceGenerate && sourceType === "title" && (
            <div>
              <button
                onClick={() => {
                  setOriginalTitle("");
                  setCanForceGenerate(false);
                  setMessage("");
                }}
              >
                다시 입력
              </button>

              <button onClick={handleForceGenerate}>자유롭게 작명</button>
            </div>
          )}

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
              formData.append("cover_style", coverStyle);
              formData.append("cover_color", coverColor);
              formData.append("force_duplicate", "true");

              if (
                titleMode === "ai" &&
                sourceType === "title" &&
                originalTitle.trim()
              ) {
                formData.append("original_title", originalTitle.trim());
              }

              if (
                titleMode === "ai" &&
                sourceType === "description" &&
                originalTitle.trim()
              ) {
                formData.append("source_description", originalTitle.trim());
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
