import { Route, Routes } from "react-router-dom";
import BookDetailPage from "./pages/BookDetailPage";
import BookAddPage from "./pages/BookAddPage";
import KeeperPage from "./pages/KeeperPage";
import LibraryPage from "./pages/LibraryPage";
import ReaderPage from "./pages/ReaderPage";


function App() {
  return (
    <Routes>
      <Route path="/keeper" element={<KeeperPage />} />
      <Route path="/books/add" element={<BookAddPage />} />
      <Route path="/library" element={<LibraryPage />} />
      <Route path="/books/:bookId" element={<BookDetailPage />} />
      <Route path="/reader/:bookId" element={<ReaderPage />} />
    </Routes>
  );
}

export default App;