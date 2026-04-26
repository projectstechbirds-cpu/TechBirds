import { Route, Routes } from "react-router-dom";
import { ScrollToTop } from "@techbirds/ui-kit";
import { Nav } from "./components/Nav";
import { Footer } from "./components/Footer";
import Index from "./pages/Index";
import Post from "./pages/Post";
import Tag from "./pages/Tag";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink-900">
      <ScrollToTop />
      <Nav />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/p/:slug" element={<Post />} />
          <Route path="/tag/:tag" element={<Tag />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
