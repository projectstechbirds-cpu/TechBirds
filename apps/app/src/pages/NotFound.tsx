import { Link } from "react-router-dom";
import { Container, Eyebrow, Button } from "@techbirds/ui-kit";

export default function NotFound() {
  return (
    <section className="py-10">
      <Container>
        <Eyebrow>404</Eyebrow>
        <h1 className="mt-4 text-display-lg text-ink-900">Page not found.</h1>
        <div className="mt-7">
          <Button asChild>
            <Link to="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
