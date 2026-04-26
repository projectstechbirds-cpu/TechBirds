from httpx import ASGITransport, AsyncClient

from app.main import app


async def test_health_returns_payload() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert "status" in body
    assert "checks" in body
    assert set(body["checks"].keys()) == {"db", "redis", "r2", "smtp"}
