import { Link } from "react-router-dom";
import { Button, PageHero } from "@techbirds/ui-kit";
import { Seo } from "@/components/Seo";

export default function NotFound() {
  return (
    <>
      <Seo title="Not found — TechBirds" noindex />
      <PageHero
        eyebrow="404"
        title="Page not found."
        lead="The page you were looking for doesn't exist or has moved."
        actions={
          <Button asChild size="lg">
            <Link to="/">Back home</Link>
          </Button>
        }
        bordered={false}
      />
    </>
  );
}
