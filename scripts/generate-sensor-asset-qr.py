"""Generate deterministic MBG sensor-asset QR artifacts.

The QR contains only the stable MBG asset URN. Human-readable identity remains
outside the QR payload so labels can be restyled without changing the asset ID.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
import uuid
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--asset-id", required=True)
    parser.add_argument("--asset-tag", required=True)
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument("--module-root", required=True, type=Path)
    return parser.parse_args()


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest().upper()


def main() -> None:
    args = parse_args()
    asset_id = uuid.UUID(args.asset_id)
    asset_tag = args.asset_tag.strip()
    if not asset_tag:
        raise ValueError("asset tag must not be blank")

    sys.path.insert(0, str(args.module_root.resolve()))
    import qrcode  # type: ignore[import-not-found]
    import qrcode.image.svg  # type: ignore[import-not-found]

    payload = f"urn:mbg:sensor-asset:{asset_id}"
    output_dir = args.output_dir.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    basename = f"{asset_tag.lower()}-{asset_id}"
    png_path = output_dir / f"{basename}.png"
    svg_path = output_dir / f"{basename}.svg"
    manifest_path = output_dir / f"{basename}.json"

    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_Q,
        box_size=12,
        border=4,
    )
    qr.add_data(payload)
    qr.make(fit=True)
    qr.make_image(fill_color="black", back_color="white").save(png_path)

    svg = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_Q,
        box_size=12,
        border=4,
        image_factory=qrcode.image.svg.SvgPathImage,
    )
    svg.add_data(payload)
    svg.make(fit=True)
    svg.make_image().save(svg_path)

    manifest = {
        "asset_id": str(asset_id),
        "asset_tag": asset_tag,
        "payload": payload,
        "error_correction": "Q",
        "png": png_path.name,
        "svg": svg_path.name,
        "png_sha256": sha256(png_path),
        "svg_sha256": sha256(svg_path),
    }
    manifest_path.write_text(
        json.dumps(manifest, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
