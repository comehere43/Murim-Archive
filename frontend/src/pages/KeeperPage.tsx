import { Link } from "react-router-dom";

function KeeperPage() {
  return (
    <main>
      <h1>서고지기</h1>

      <p>무엇을 도와드릴까요?</p>

      <nav>
        <Link to="/books/add">새 비급 등록</Link>
        <br />
        <Link to="/library">서고 보기</Link>
      </nav>
    </main>
  );
}

export default KeeperPage;
