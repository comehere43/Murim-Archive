import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createBook } from "../api/books";


function BookAddPage() {
  const navigate = useNavigate();
 
  const [file, setFile] = useState<File | null>(null);
  const [titleMode, setTitleMode] = useState<"manual" | "ai" | null>(null);
  const [displayTitle, setDisplayTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  async function handleSubmit() {
    if (!file) {
      setMessage("PDF를 선택해주십시오.");
      return;
    }

    if (titleMode !== "manual") {
      setMessage("현재는 직접 짓기 방식만 등록할 수 있습니다.");
      return;
    }

    if (!displayTitle.trim()) {
      setMessage("비급명을 입력해주십시오.");
      return;
    }

    const formData = new FormData();

    formData.append("file", file);
    formData.append("display_title", displayTitle);
    formData.append("title_mode", "manual");
    formData.append("cover_style", "navy");

    setIsSubmitting(true);
    setMessage("비급을 서고에 등록하고 있습니다...");

    try {
      
        const data = await createBook(formData);

      setMessage(
        `「${data.display_title}」이(가) 서고에 등록되었습니다.`,
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

        <button onClick={() => setTitleMode("manual")}>
          내가 직접 짓기
        </button>

        <button onClick={() => setTitleMode("ai")}>
          서고지기에게 맡기기
        </button>
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

          <p>서고지기의 작명 기능은 다음 단계에서 연결합니다.</p>
        </section>
      )}

      {message && <p>{message}</p>}
      {isSuccess && (
  <button onClick={() => navigate("/keeper")}>
    뒤로가기
  </button>
)}
    </main>
  );
}

export default BookAddPage;