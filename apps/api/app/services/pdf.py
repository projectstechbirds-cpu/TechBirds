"""Render HTML → PDF for payslips and other docs.

WeasyPrint is heavy (Pango/Cairo). We import it lazily so test runs that don't
exercise PDF generation don't pay the import cost — and so the package stays
installable on machines without the system libs.
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.services.payroll import ComputedPayslip

TEMPLATES_DIR = Path(__file__).resolve().parent.parent / "templates"

_env = Environment(
    loader=FileSystemLoader(str(TEMPLATES_DIR)),
    autoescape=select_autoescape(["html"]),
)


def _money(d: Decimal | str | float | int) -> str:
    return f"₹{Decimal(d):,.2f}"


_env.filters["money"] = _money


def render_payslip_html(
    *,
    employee_name: str,
    employee_code: str | None,
    designation: str | None,
    period_label: str,
    payslip: ComputedPayslip,
    company_name: str = "TechBirds Group",
) -> str:
    template = _env.get_template("payslip.html")
    return template.render(
        employee_name=employee_name,
        employee_code=employee_code or "—",
        designation=designation or "—",
        period_label=period_label,
        payslip=payslip,
        company_name=company_name,
        generated_on=date.today().isoformat(),
    )


def render_pdf(html: str) -> bytes:
    # Lazy import — see module docstring.
    from weasyprint import HTML  # type: ignore[import-not-found]

    return HTML(string=html).write_pdf()
