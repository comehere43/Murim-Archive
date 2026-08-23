import { Route, Routes } from "react-router-dom";

import BookAddPage from "./pages/BookAddPage";

function App() {
  return (
    <Routes>
      <Route path="/books/add" element={<BookAddPage />} />
    </Routes>
  );
}

export default App;