import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Landing } from "./pages/Landing";
import { NewScreening } from "./pages/NewScreening";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/new" element={<NewScreening />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;