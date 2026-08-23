from __future__ import annotations

import hmac
from dataclasses import dataclass

import httpx
from fastapi import Depends, Header, HTTPException, status

from src.core.config import settings


@dataclass(slots=True)
class AuthenticatedUser:
    user_id: str
    role: str
    access_token: str
    profile: dict


def require_authenticated_user(
    authorization: str | None = Header(default=None),
    x_ai_service_token: str | None = Header(default=None),
    x_internal_secret: str | None = Header(default=None),
) -> AuthenticatedUser:
    validate_service_token(x_ai_service_token, x_internal_secret)
    access_token = _extract_bearer_token(authorization)
    profile = _fetch_user_profile(access_token)
    user_id = str(profile.get("id") or "").strip()
    role = str(profile.get("role") or "").strip()

    if not user_id or not role:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Authenticated user context is incomplete.",
        )

    return AuthenticatedUser(
        user_id=user_id,
        role=role,
        access_token=access_token,
        profile=profile,
    )


def require_service_request(
    x_ai_service_token: str | None = Header(default=None),
    x_internal_secret: str | None = Header(default=None),
) -> None:
    validate_service_token(x_ai_service_token, x_internal_secret)


def require_admin_request(x_ai_admin_token: str | None = Header(default=None)) -> None:
    expected = (settings.ai_admin_token or "").strip()
    provided = (x_ai_admin_token or "").strip()
    if not expected:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI admin authentication is not configured.",
        )
    if not hmac.compare_digest(provided, expected):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid AI admin token.",
        )


CurrentUser = Depends(require_authenticated_user)
ServiceRequest = Depends(require_service_request)
AdminRequest = Depends(require_admin_request)


def validate_service_token(service_token: str | None, legacy_token: str | None = None) -> None:
    expected = (settings.ai_service_token or "").strip()
    if not expected:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service authentication is not configured.",
        )

    provided = (service_token or "").strip()
    if provided and hmac.compare_digest(provided, expected):
        return

    if _is_valid_legacy_secret(legacy_token):
        return

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid AI service token.",
    )


def _is_valid_legacy_secret(legacy_token: str | None) -> bool:
    legacy_expected = (settings.ai_internal_secret or "").strip()
    provided = (legacy_token or "").strip()
    return bool(provided and legacy_expected and hmac.compare_digest(provided, legacy_expected))


def _extract_bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header.",
        )

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header must be a Bearer token.",
        )

    return token.strip()


def _fetch_user_profile(access_token: str) -> dict:
    base_url = settings.nestjs_base_url.rstrip("/")
    api_prefix = "/" + settings.nestjs_api_prefix.strip("/")
    url = f"{base_url}{api_prefix}/users/me"

    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.get(url, headers={"Authorization": f"Bearer {access_token}"})
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User token is invalid or expired.",
            ) from exc
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to validate user context with NestJS.",
        ) from exc
    except httpx.TimeoutException as exc:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Timed out while validating user context with NestJS.",
        ) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not reach NestJS to validate user context.",
        ) from exc

    payload = response.json()
    if isinstance(payload, dict) and isinstance(payload.get("data"), dict):
        return payload["data"]
    if isinstance(payload, dict):
        return payload

    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail="NestJS returned an unexpected user profile response.",
    )
