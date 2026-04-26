import { useEffect, useState } from "react";
import { Card, CardBody, CardTitle } from "@techbirds/ui-kit";
import type { Birthday, WorkAnniversary } from "@techbirds/sdk";
import { api } from "@/lib/api";

function relativeDay(days: number): string {
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}

export function PeopleWidget() {
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [anniversaries, setAnniversaries] = useState<WorkAnniversary[]>([]);

  useEffect(() => {
    void Promise.all([api.upcomingBirthdays(30), api.upcomingAnniversaries(30)])
      .then(([b, a]) => {
        setBirthdays(b);
        setAnniversaries(a);
      })
      .catch(() => {
        /* widget is best-effort */
      });
  }, []);

  if (birthdays.length === 0 && anniversaries.length === 0) return null;

  return (
    <Card>
      <CardTitle>Coming up</CardTitle>
      <CardBody className="mt-2 space-y-3">
        {birthdays.length > 0 && (
          <div>
            <p className="text-body-sm font-semibold text-ink-700">Birthdays</p>
            <ul className="mt-1 space-y-1">
              {birthdays.slice(0, 5).map((b) => (
                <li key={b.user_id} className="text-body-sm text-ink-500">
                  <span className="text-ink-900">{b.full_name}</span> — {relativeDay(b.days_until)}
                </li>
              ))}
            </ul>
          </div>
        )}
        {anniversaries.length > 0 && (
          <div>
            <p className="text-body-sm font-semibold text-ink-700">Work anniversaries</p>
            <ul className="mt-1 space-y-1">
              {anniversaries.slice(0, 5).map((a) => (
                <li key={a.user_id} className="text-body-sm text-ink-500">
                  <span className="text-ink-900">{a.full_name}</span> — {a.years} yr
                  {a.years === 1 ? "" : "s"} {relativeDay(a.days_until)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
