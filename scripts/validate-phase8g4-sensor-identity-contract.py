"""Static contract validation for the proposal-only Phase 8G.4 package."""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
FORWARD_PATH = REPO_ROOT / "docs/sql/phase8g4-sensor-asset-installation-contract-proposal.sql"
ROLLBACK_PATH = REPO_ROOT / "docs/sql/phase8g4-sensor-asset-installation-contract-rollback.sql"
VALIDATION_PATH = REPO_ROOT / "docs/sql/phase8g4-sensor-asset-installation-contract-validation.sql"
DESIGN_PATH = REPO_ROOT / "docs/product/phase8g4-sensor-identity-and-field-replacement-design.md"
PILOT_SQL_PATH = REPO_ROOT / "docs/sql/phase8g4-ms02-first-asset-proposal.sql"
PILOT_DOC_PATH = REPO_ROOT / "docs/product/phase8g4-ms02-digital-qr-pilot.md"
PILOT_ASSET_DIR = REPO_ROOT / "docs/product/assets/phase8g4-ms02-qr"
PILOT_BASENAME = "mbg-sa-000001-873bc473-98fc-4b23-beeb-5d80e7bf945a"
PILOT_MANIFEST_PATH = PILOT_ASSET_DIR / f"{PILOT_BASENAME}.json"


def read(path: Path) -> str:
    if not path.is_file():
        raise AssertionError(f"Missing required Phase 8G.4 artifact: {path.relative_to(REPO_ROOT)}")
    text = path.read_text(encoding="utf-8")
    if not text.endswith("\n"):
        raise AssertionError(f"Artifact must end with a newline: {path.relative_to(REPO_ROOT)}")
    trailing = [
        line_number
        for line_number, line in enumerate(text.splitlines(), start=1)
        if line.endswith((" ", "\t"))
    ]
    if trailing:
        raise AssertionError(
            f"Trailing whitespace in {path.relative_to(REPO_ROOT)} at lines {trailing[:5]}"
        )
    return text


def uncommented_sql(sql: str) -> str:
    return "\n".join(line.split("--", 1)[0] for line in sql.splitlines())


def require(text: str, fragment: str, source: str) -> None:
    normalized_text = " ".join(text.lower().split())
    normalized_fragment = " ".join(fragment.lower().split())
    if normalized_fragment not in normalized_text:
        raise AssertionError(f"{source} is missing required contract fragment: {fragment}")


def forbid_pattern(text: str, pattern: str, source: str) -> None:
    if re.search(pattern, text, flags=re.IGNORECASE | re.MULTILINE):
        raise AssertionError(f"{source} contains prohibited pattern: {pattern}")


def validate_forward(sql: str) -> None:
    source = FORWARD_PATH.name
    body = uncommented_sql(sql)
    require(sql, "PROPOSAL ONLY — NOT EXECUTED", source)
    if len(re.findall(r"\bcreate\s+table\b", body, flags=re.IGNORECASE)) != 2:
        raise AssertionError(f"{source} must create exactly two base tables")
    if len(re.findall(r"\bcreate\s+view\b", body, flags=re.IGNORECASE)) != 2:
        raise AssertionError(f"{source} must create exactly two Support views")

    for fragment in (
        "create table public.sensor_assets",
        "create table public.sensor_installations",
        "asset_tag text not null",
        "create unique index sensor_assets_asset_tag_unique",
        "on public.sensor_assets (lower(asset_tag))",
        "manufacturer_serial text null",
        "hardware_uid_scheme text null",
        "hardware_uid text null",
        "create unique index sensor_assets_hardware_uid_unique",
        "sensor_asset_id uuid not null references public.sensor_assets(id)",
        "device_id text not null references public.device_registry(device_id)",
        "logical_sensor_key text not null",
        "sensor_installations_device_key_no_overlap",
        "sensor_installations_asset_no_overlap",
        "'[)'",
        "alter table public.sensor_assets enable row level security",
        "alter table public.sensor_installations enable row level security",
        "create view public.support_sensor_assets",
        "create view public.support_sensor_installations",
        "with (security_barrier = true)",
        "grant select on public.support_sensor_assets to authenticated",
        "grant select on public.support_sensor_installations to authenticated",
    ):
        require(body, fragment, source)

    for pattern in (
        r"\binsert\s+into\b",
        r"\bupdate\s+public\.",
        r"\bdelete\s+from\b",
        r"\btruncate\b",
        r"\bcreate\s+(or\s+replace\s+)?function\b",
        r"\bphysical_sensor_id\b",
        r"\bcustomer_sensor_",
        r"\bhosted_gen2_measurements\b",
        r"\bsensor_measurements_flat\b",
    ):
        forbid_pattern(body, pattern, source)


def validate_rollback(sql: str) -> None:
    source = ROLLBACK_PATH.name
    body = uncommented_sql(sql)
    require(sql, "PROPOSAL ONLY — NOT EXECUTED", source)
    required_order = (
        "drop view if exists public.support_sensor_installations",
        "drop view if exists public.support_sensor_assets",
        "drop table if exists public.sensor_installations",
        "drop table if exists public.sensor_assets",
    )
    positions = []
    for fragment in required_order:
        require(body, fragment, source)
        positions.append(body.lower().index(fragment))
    if positions != sorted(positions):
        raise AssertionError(f"{source} does not drop objects in dependency order")
    forbid_pattern(body, r"\bcascade\b", source)
    forbid_pattern(body, r"\bdrop\s+extension\b", source)


def validate_read_only_validation(sql: str) -> None:
    source = VALIDATION_PATH.name
    body = uncommented_sql(sql)
    require(sql, "PROPOSAL ONLY — NOT EXECUTED", source)
    for fragment in (
        "sensor_assets",
        "sensor_installations",
        "pg_get_constraintdef",
        "has_table_privilege",
        "security_barrier",
        "sensor_installations_device_key_no_overlap",
        "sensor_installations_asset_no_overlap",
        "explain (format json)",
        "set local role authenticated",
        "rollback",
    ):
        require(sql, fragment, source)
    for pattern in (
        r"\binsert\s+into\b",
        r"\bupdate\s+public\.",
        r"\bdelete\s+from\b",
        r"\btruncate\b",
        r"\bcreate\s+(table|view|function|index)\b",
        r"\balter\s+table\b",
        r"\bdrop\s+(table|view|function|index|extension)\b",
        r"\bexplain\s*\([^)]*analyze",
    ):
        forbid_pattern(body, pattern, source)


def validate_design(markdown: str) -> None:
    source = DESIGN_PATH.name
    for fragment in (
        "Status: design approved",
        "sensor_assets",
        "sensor_installations",
        "Do not add `sensor_asset_id` to routine measurements",
        "DS18B20's 64-bit ROM",
        "first post-replacement `/measurements` package",
        "inclusive-start/exclusive-end",
        "Measurements are never rewritten",
        "no browser write function",
        "3.3V-only",
        "introduces no 5V proposal",
        "No RMI watering threshold",
        "separate frontend slice",
        "separate approval",
    ):
        require(markdown, fragment, source)


def validate_pilot_sql(sql: str) -> None:
    source = PILOT_SQL_PATH.name
    body = uncommented_sql(sql)
    require(sql, "EXECUTED WITH SEPARATE APPROVAL — 2026-08-27 UTC", source)
    for fragment in (
        "insert into public.sensor_assets",
        "873bc473-98fc-4b23-beeb-5d80e7bf945a",
        "MBG-SA-000001",
        "SEN0308",
        "DFRobot",
        "active_support_actor_count <> 1",
        "Asset registration only; no installation interval is created",
    ):
        require(sql, fragment, source)
    if len(re.findall(r"\binsert\s+into\b", body, flags=re.IGNORECASE)) != 1:
        raise AssertionError(f"{source} must contain exactly one INSERT")
    for pattern in (
        r"\binsert\s+into\s+public\.sensor_installations\b",
        r"\bupdate\s+public\.",
        r"\bdelete\s+from\b",
        r"\btruncate\b",
        r"\bon\s+conflict\b",
        r"\bcreate\s+(table|view|function|index)\b",
        r"\balter\s+table\b",
        r"\bdrop\s+(table|view|function|index|extension)\b",
    ):
        forbid_pattern(body, pattern, source)


def validate_pilot_artifacts(markdown: str) -> None:
    source = PILOT_DOC_PATH.name
    payload = "urn:mbg:sensor-asset:873bc473-98fc-4b23-beeb-5d80e7bf945a"
    for fragment in (
        "MS02 installed on Prototype02",
        "MBG-SA-000001",
        payload,
        "no `sensor_installations` row is inferred",
        "never grant browser clients direct writes",
    ):
        require(markdown, fragment, source)

    manifest = json.loads(read(PILOT_MANIFEST_PATH))
    if manifest["asset_id"] != "873bc473-98fc-4b23-beeb-5d80e7bf945a":
        raise AssertionError("Pilot QR manifest has the wrong asset UUID")
    if manifest["asset_tag"] != "MBG-SA-000001":
        raise AssertionError("Pilot QR manifest has the wrong asset tag")
    if manifest["payload"] != payload:
        raise AssertionError("Pilot QR manifest has the wrong payload")

    for kind in ("png", "svg"):
        artifact_path = PILOT_ASSET_DIR / manifest[kind]
        if not artifact_path.is_file():
            raise AssertionError(f"Missing pilot QR artifact: {artifact_path}")
        actual_hash = hashlib.sha256(artifact_path.read_bytes()).hexdigest().upper()
        if actual_hash != manifest[f"{kind}_sha256"]:
            raise AssertionError(f"Pilot QR {kind.upper()} hash mismatch")


def main() -> None:
    forward = read(FORWARD_PATH)
    rollback = read(ROLLBACK_PATH)
    validation = read(VALIDATION_PATH)
    design = read(DESIGN_PATH)
    pilot_sql = read(PILOT_SQL_PATH)
    pilot_doc = read(PILOT_DOC_PATH)

    validate_forward(forward)
    validate_rollback(rollback)
    validate_read_only_validation(validation)
    validate_design(design)
    validate_pilot_sql(pilot_sql)
    validate_pilot_artifacts(pilot_doc)

    print("[PASS] Phase 8G.4 proposal creates only the approved additive identity model.")
    print("[PASS] Asset, logical, manufacturer, hardware UID, and interval identities remain separate.")
    print("[PASS] RLS/read surfaces, rollback order, read-only validation, and scope boundaries are guarded.")
    print("[PASS] MS02 pilot registers one asset only and QR hashes/payload metadata match.")


if __name__ == "__main__":
    main()
