"""Logging setup. JSON-ish in production, human-readable in dev.

Uses structlog where it's already a dependency, but keeps stdlib loggers as the
emit path so anything that already uses `logging.getLogger(...)` Just Works.
"""

from __future__ import annotations

import logging
import sys

import structlog


def configure_logging(environment: str, level: str = "INFO") -> None:
    log_level = getattr(logging, level.upper(), logging.INFO)
    timestamper = structlog.processors.TimeStamper(fmt="iso", utc=True)

    shared_processors = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        timestamper,
    ]

    if environment == "production":
        renderer: structlog.types.Processor = structlog.processors.JSONRenderer()
        formatter = structlog.stdlib.ProcessorFormatter(
            foreign_pre_chain=shared_processors,
            processors=[
                structlog.stdlib.ProcessorFormatter.remove_processors_meta,
                renderer,
            ],
        )
    else:
        renderer = structlog.dev.ConsoleRenderer(colors=False)
        formatter = structlog.stdlib.ProcessorFormatter(
            foreign_pre_chain=shared_processors,
            processors=[
                structlog.stdlib.ProcessorFormatter.remove_processors_meta,
                renderer,
            ],
        )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(log_level)

    # Quiet a couple of noisy libraries by default.
    for noisy in ("uvicorn.access", "botocore", "urllib3"):
        logging.getLogger(noisy).setLevel(logging.WARNING)

    structlog.configure(
        processors=[
            *shared_processors,
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )
