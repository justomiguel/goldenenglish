#!/usr/bin/env python3
"""One-off: build src/dictionaries/pt.json from en.json via Google Translate (deep-translator).

Preserves `{placeholder}` tokens. Run from repo root with venv that has deep-translator."""

from __future__ import annotations

import json
import re
import sys
import time
from pathlib import Path
from typing import Any

from deep_translator import GoogleTranslator

PLACEHOLDER_RE = re.compile(r"\{[^}]+\}")
ROOT = Path(__file__).resolve().parents[1]
EN_PATH = ROOT / "src/dictionaries/en.json"
OUT_PATH = ROOT / "src/dictionaries/pt.json"

BATCH = 45
SLEEP_S = 0.35


def protect(s: str) -> tuple[str, list[str]]:
    keys: list[str] = []

    def repl(m: re.Match[str]) -> str:
        keys.append(m.group(0))
        return f"⟨{len(keys) - 1}⟩"

    return PLACEHOLDER_RE.sub(repl, s), keys


def restore(s: str, keys: list[str]) -> str:
    for i, k in enumerate(keys):
        s = s.replace(f"⟨{i}⟩", k)
    return s


def walk_strings(obj: Any, acc: list[str]) -> None:
    if isinstance(obj, str):
        acc.append(obj)
        return
    if isinstance(obj, list):
        for x in obj:
            walk_strings(x, acc)
        return
    if isinstance(obj, dict):
        for v in obj.values():
            walk_strings(v, acc)


def rebuild(obj: Any, mapping: dict[str, str]) -> Any:
    if isinstance(obj, str):
        return mapping.get(obj, obj)
    if isinstance(obj, list):
        return [rebuild(x, mapping) for x in obj]
    if isinstance(obj, dict):
        return {k: rebuild(v, mapping) for k, v in obj.items()}
    return obj


def main() -> int:
    en_obj = json.loads(EN_PATH.read_text(encoding="utf-8"))
    originals: list[str] = []
    walk_strings(en_obj, originals)
    unique_orig = list(dict.fromkeys(originals))

    entries: list[tuple[str, str, list[str]]] = []
    for orig in unique_orig:
        prot, keys = protect(orig)
        entries.append((orig, prot, keys))

    unique_prot = list(dict.fromkeys(e[1] for e in entries))
    translator = GoogleTranslator(source="en", target="pt")
    prot_to_pt: dict[str, str] = {}

    for i in range(0, len(unique_prot), BATCH):
        chunk = unique_prot[i : i + BATCH]
        attempt = 0
        while True:
            try:
                done = translator.translate_batch(chunk)
                break
            except Exception as exc:  # pragma: no cover — network path
                attempt += 1
                if attempt > 5:
                    print("fatal:", exc, file=sys.stderr)
                    return 1
                time.sleep(2 * attempt)
        if len(done) != len(chunk):
            print("batch length mismatch", len(done), len(chunk), file=sys.stderr)
            return 1
        for p, t in zip(chunk, done):
            prot_to_pt[p] = t
        time.sleep(SLEEP_S)
        print(f"translated {min(i + BATCH, len(unique_prot))}/{len(unique_prot)}", flush=True)

    mapping: dict[str, str] = {}
    for orig, prot, keys in entries:
        mapping[orig] = restore(prot_to_pt[prot], keys)

    pt_obj = rebuild(en_obj, mapping)
    OUT_PATH.write_text(json.dumps(pt_obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("wrote", OUT_PATH)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
