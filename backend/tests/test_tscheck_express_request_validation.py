"""
Criterion: Express request validation — non-string rejectionText/query,
malformed JSON, and missing/non-numeric screenshot dimensions all return
JSON 400 responses (see /app/Fix-It/server.ts routes: /api/rejection/analyze,
/api/try-now, /api/screenshots/validate, and the catch-all error middleware).
"""
import httpx


def test_rejection_analyze_rejects_non_string_text(client: httpx.Client):
    resp = client.post("/api/rejection/analyze", json={"rejectionText": 12345})
    assert resp.status_code == 400, resp.text
    body = resp.json()
    assert "error" in body


def test_rejection_analyze_rejects_missing_text(client: httpx.Client):
    resp = client.post("/api/rejection/analyze", json={})
    assert resp.status_code == 400, resp.text
    assert "error" in resp.json()


def test_try_now_rejects_non_string_query(client: httpx.Client):
    resp = client.post("/api/try-now", json={"query": {"nested": "object"}})
    assert resp.status_code == 400, resp.text
    assert "error" in resp.json()


def test_try_now_rejects_empty_query(client: httpx.Client):
    resp = client.post("/api/try-now", json={"query": "   "})
    assert resp.status_code == 400, resp.text
    assert "error" in resp.json()


def test_screenshots_validate_rejects_missing_dimensions(client: httpx.Client):
    resp = client.post("/api/screenshots/validate", json={"fileName": "shot.png"})
    assert resp.status_code == 400, resp.text
    assert "error" in resp.json()


def test_screenshots_validate_rejects_non_numeric_dimensions(client: httpx.Client):
    resp = client.post(
        "/api/screenshots/validate",
        json={"width": "1290", "height": "2796", "fileName": "shot.png"},
    )
    assert resp.status_code == 400, resp.text
    assert "error" in resp.json()


def test_screenshots_validate_accepts_valid_numeric_dimensions(client: httpx.Client):
    resp = client.post(
        "/api/screenshots/validate",
        json={"width": 1290, "height": 2796, "fileName": "shot.png"},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert "isValidDimension" in body or "matchedDevice" in body


def test_malformed_json_body_returns_400(client: httpx.Client):
    # Raw invalid JSON payload — express.json() body-parser should fail and
    # the catch-all error middleware should respond with a JSON 400, not a
    # raw stack trace / HTML error page.
    resp = client.post(
        "/api/rejection/analyze",
        content=b"{not valid json,,,",
        headers={"Content-Type": "application/json"},
    )
    assert resp.status_code == 400, resp.text
    ctype = resp.headers.get("content-type", "")
    assert "application/json" in ctype, f"expected JSON error body, got content-type={ctype!r} body={resp.text!r}"
    assert "error" in resp.json()
