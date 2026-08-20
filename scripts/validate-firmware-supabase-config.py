"""Validate or safely migrate the ignored firmware Supabase configuration.

Diagnostics intentionally report classifications only. They never echo URL or key
values, including on validation failure.
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlsplit


URL_DEFINE = re.compile(rb'(?m)^(\s*#define\s+SUPABASE_URL\s+")([^"]*)("\s*)$')
KEY_DEFINE = re.compile(rb'(?m)^\s*#define\s+SUPABASE_ANON_KEY\s+"([^"]*)"\s*$')
PROJECT_HOST = re.compile(r"^[a-z0-9]+\.supabase\.co$")
TABLE_PATH = re.compile(r"^/rest/v1/[^/]+/?$")
PLACEHOLDER_MARKERS = (
    "your_",
    "your-",
    "placeholder",
    "replace",
    "example",
    "changeme",
    "project_ref",
    "project-ref",
)


class SafeValidationError(ValueError):
    """A configuration failure whose message contains no configuration value."""


@dataclass(frozen=True)
class SafeClassification:
    https: bool
    recognized_project_host: bool
    url_shape: str
    key_defined_non_placeholder: bool


def _is_placeholder(value: str) -> bool:
    lowered = value.strip().lower()
    return not lowered or any(marker in lowered for marker in PLACEHOLDER_MARKERS)


def _parse_url(url: str):
    try:
        parsed = urlsplit(url)
        _ = parsed.port
    except ValueError as exc:
        raise SafeValidationError("firmware Supabase URL is malformed") from exc
    return parsed


def classify(url: str, key: str) -> SafeClassification:
    parsed = _parse_url(url)
    host = parsed.hostname or ""
    path = parsed.path
    if path in ("", "/"):
        shape = "project-root"
    elif path.rstrip("/") == "/rest/v1":
        shape = "rest-root"
    elif TABLE_PATH.fullmatch(path):
        shape = "table-suffixed"
    else:
        shape = "other-path"
    return SafeClassification(
        https=parsed.scheme == "https",
        recognized_project_host=bool(PROJECT_HOST.fullmatch(host)),
        url_shape=shape,
        key_defined_non_placeholder=not _is_placeholder(key),
    )


def validate(url: str, key: str, *, allowed_shape: str = "project-root") -> SafeClassification:
    result = classify(url, key)
    parsed = _parse_url(url)
    if url != url.strip() or any(character.isspace() for character in url):
        raise SafeValidationError("firmware Supabase URL is malformed")
    if not result.https:
        raise SafeValidationError("firmware Supabase URL must use HTTPS")
    if not result.recognized_project_host:
        raise SafeValidationError("firmware Supabase URL must use a recognized project host")
    if parsed.username or parsed.password or parsed.port is not None:
        raise SafeValidationError("firmware Supabase URL authority is malformed")
    if parsed.query or parsed.fragment:
        raise SafeValidationError("firmware Supabase URL must not contain query or fragment data")
    project_ref = (parsed.hostname or "").removesuffix(".supabase.co")
    if _is_placeholder(project_ref):
        raise SafeValidationError("firmware Supabase URL contains a placeholder project host")
    if result.url_shape != allowed_shape:
        raise SafeValidationError(f"firmware Supabase URL must use {allowed_shape} shape")
    if not result.key_defined_non_placeholder:
        raise SafeValidationError("firmware Supabase key must be defined and non-placeholder")
    return result


def read_defines(config_path: Path) -> tuple[bytes, str, str]:
    raw = config_path.read_bytes()
    url_match = URL_DEFINE.search(raw)
    key_match = KEY_DEFINE.search(raw)
    if not url_match:
        raise SafeValidationError("firmware Supabase URL definition is missing or malformed")
    if not key_match:
        raise SafeValidationError("firmware Supabase key definition is missing or malformed")
    try:
        return raw, url_match.group(2).decode("utf-8"), key_match.group(1).decode("utf-8")
    except UnicodeDecodeError as exc:
        raise SafeValidationError("firmware Supabase configuration encoding is invalid") from exc


def validate_file(config_path: Path) -> SafeClassification:
    _, url, key = read_defines(config_path)
    return validate(url, key)


def migrate_table_suffix_to_project_root(config_path: Path) -> SafeClassification:
    raw, url, key = read_defines(config_path)
    validate(url, key, allowed_shape="table-suffixed")
    parsed = _parse_url(url)
    project_root = f"https://{parsed.hostname}"
    migrated = URL_DEFINE.sub(
        lambda match: match.group(1) + project_root.encode("utf-8") + match.group(3),
        raw,
        count=1,
    )
    if migrated == raw:
        raise SafeValidationError("firmware Supabase URL migration made no change")
    config_path.write_bytes(migrated)
    return validate_file(config_path)


def resolve_table_url(project_root: str, table_name: str) -> str:
    return project_root.rstrip("/") + "/rest/v1/" + table_name


def run_self_tests() -> None:
    key = "synthetic_key_value_123"
    valid_roots = (
        "https://abcdefghijklmnopqrst.supabase.co",
        "https://abcdefghijklmnopqrst.supabase.co/",
    )
    tables = ("sensor_measurement_batches", "device_heartbeats", "watering_events")
    for root in valid_roots:
        validate(root, key)
        for table in tables:
            expected = "https://abcdefghijklmnopqrst.supabase.co/rest/v1/" + table
            if resolve_table_url(root, table) != expected:
                raise SafeValidationError("root URL resolver test failed")

    invalid_cases = {
        "placeholder": ("https://your_project.supabase.co", key),
        "table-suffixed": (
            "https://abcdefghijklmnopqrst.supabase.co/rest/v1/legacy_table",
            key,
        ),
        "rest-root": ("https://abcdefghijklmnopqrst.supabase.co/rest/v1", key),
        "non-https": ("http://abcdefghijklmnopqrst.supabase.co", key),
        "malformed": ("not-a-url", key),
        "other-path": ("https://abcdefghijklmnopqrst.supabase.co/other", key),
        "unrecognized-host": ("https://abcdefghijklmnopqrst.example.com", key),
        "query": ("https://abcdefghijklmnopqrst.supabase.co?unsafe=true", key),
        "placeholder-key": (valid_roots[0], "your_supabase_anon_key"),
    }
    for case_name, (url, candidate_key) in invalid_cases.items():
        try:
            validate(url, candidate_key)
        except SafeValidationError:
            continue
        raise SafeValidationError(f"negative configuration test unexpectedly passed: {case_name}")


def print_safe_classification(result: SafeClassification) -> None:
    print(
        "[PASS] Firmware Supabase config: "
        f"HTTPS={result.https}; "
        f"recognized_project_host={result.recognized_project_host}; "
        f"url_shape={result.url_shape}; "
        f"key_defined_non_placeholder={result.key_defined_non_placeholder}"
    )


def cli() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", type=Path, default=Path("src/config.h"))
    parser.add_argument("--self-test", action="store_true")
    parser.add_argument("--migrate-private-config", action="store_true")
    args = parser.parse_args()
    try:
        if args.self_test:
            run_self_tests()
            print("[PASS] Firmware Supabase resolver and negative configuration tests passed.")
            return 0
        if args.migrate_private_config:
            result = migrate_table_suffix_to_project_root(args.config)
            print("[PASS] Firmware Supabase URL migrated without revealing configuration values.")
        else:
            result = validate_file(args.config)
        print_safe_classification(result)
        return 0
    except (OSError, SafeValidationError) as exc:
        print(f"[FAIL] {exc}", file=sys.stderr)
        return 1


def platformio_guard() -> None:
    Import("env")  # type: ignore[name-defined]  # Provided by PlatformIO/SCons.
    config_path = Path(env["PROJECT_SRC_DIR"]) / "config.h"  # type: ignore[name-defined]
    try:
        print_safe_classification(validate_file(config_path))
    except (OSError, SafeValidationError) as exc:
        print(f"[FAIL] {exc}", file=sys.stderr)
        env.Exit(1)  # type: ignore[name-defined]


if "Import" in globals():
    platformio_guard()
elif __name__ == "__main__":
    raise SystemExit(cli())
