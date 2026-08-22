import { useEffect, useState } from "react";

function App() {
  const [message, setMessage] = useState("백엔드 연결 확인 중...");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/")
      .then((response) => response.json())
      .then((data) => setMessage(data.message))
      .catch(() => setMessage("백엔드 연결 실패"));
  }, []);

  return (
    <main>
      <h1>Murim Archive</h1>
      <p>{message}</p>
    </main>
  );
}

export default App;