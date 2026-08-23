import { useState } from "react";

function BookAddPage() {
  const [file, setFile] = useState<File | null>(null);
  const [titleMode, setTitleMode] = useState<"manual" | "ai" | null>(null);
  const [displayTitle, setDisplayTitle] = useState("");

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
        </section>
      )}

      {titleMode === "ai" && (
        <section>
          <h2>원전의 이름을 알려주십시오</h2>

          <p>서고지기의 작명 기능은 다음 단계에서 연결합니다.</p>
        </section>
      )}
    </main>
  );
}

export default BookAddPage;