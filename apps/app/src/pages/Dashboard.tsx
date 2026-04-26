import { Link } from "react-router-dom";
import { Card, CardBody, CardTitle, Container, Eyebrow, LinkCard } from "@techbirds/ui-kit";
import { portalNav } from "@techbirds/content";
import { useAuth } from "@/auth/AuthContext";
import { PeopleWidget } from "@/components/PeopleWidget";

export default function Dashboard() {
  const { user } = useAuth();
  const greeting = user?.full_name?.split(" ")[0] ?? "";

  return (
    <section className="py-9">
      <Container>
        <Eyebrow>Welcome back</Eyebrow>
        <h1 className="mt-3 text-display-md text-ink-900">
          {greeting ? `Hello, ${greeting}.` : "Dashboard."}
        </h1>
        <p className="mt-3 max-w-2xl text-body-lg text-ink-500">
          Everything you need for the day, in one place.
        </p>
        <div className="mt-7 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {portalNav
            .filter((n) => n.to !== "/dashboard")
            .map((n) => (
              <LinkCard key={n.to} asChild eyebrow="Portal" title={n.label} body={n.description}>
                <Link to={n.to} />
              </LinkCard>
            ))}
          <PeopleWidget />
          {!user?.is_employee && (
            <Card>
              <CardTitle>Note</CardTitle>
              <CardBody className="mt-2 text-ink-500">
                Your account isn't marked as an employee yet, so punch is disabled. Ask HR to flip
                the switch.
              </CardBody>
            </Card>
          )}
        </div>
      </Container>
    </section>
  );
}
