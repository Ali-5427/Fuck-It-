import os
import httpx
import pytest

# The Fix-It repo (/app/Fix-It) is a Vite + Express app, not the FastAPI/Mongo
# farm-ts template. Its API is served by an Express middleware embedded inside
# the Vite dev server on port 3500 (see /app/Fix-It/vite.config.ts:
# expressApiPlugin -> createServerApp()). There is no separate :8001 FastAPI
# backend for this repo, so tests target the actual running app entrypoint.
BASE_URL = os.environ.get("FIXIT_API_BASE_URL", "http://localhost:3500")


@pytest.fixture(scope="session")
def api_base_url():
    return BASE_URL


@pytest.fixture(scope="session")
def client():
    with httpx.Client(base_url=BASE_URL, timeout=15.0) as c:
        yield c
