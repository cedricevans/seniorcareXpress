#!/usr/bin/env python3
"""Compare the VA form editions we fill against the editions VA currently publishes.

Reads the current-template backups in apps/pocketbase/va-forms/*.json, downloads each
form from vba.va.gov, and reads the edition printed on it ("VA FORM 21-0845, MAY 2026").
Exits 1 when VA has published a newer edition (our template must be replaced and its
field map rebuilt, see RAILWAY_OPERATIONS.md section 8b) or when a form can't be checked.
Expiring or expired OMB dates on an edition VA still publishes are warnings only.

Needs pdftotext (poppler). Usage: python3 tools/check_va_editions.py
"""
import datetime
import glob
import json
import os
import re
import subprocess
import sys
import tempfile
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FORMS_DIR = os.path.join(ROOT, "apps", "pocketbase", "va-forms")
WARN_DAYS = 45
IN_ACTIONS = os.environ.get("GITHUB_ACTIONS") == "true"


def report(level, msg):
    print(f"::{level}::{msg}" if IN_ACTIONS else f"{level.upper()}: {msg}")


def edition_of(pdf_path, form_number):
    text = re.sub(r"\s+", " ", subprocess.run(["pdftotext", pdf_path, "-"], capture_output=True, text=True, check=True).stdout)
    m = re.search(r"(?<!SUPERSEDES )VA FORM " + re.escape(form_number) + r", ([A-Z]{3} \d{4})", text, re.I)
    return m.group(1).upper() if m else None


def main():
    failed = False
    today = datetime.date.today()
    for path in sorted(glob.glob(os.path.join(FORMS_DIR, "*.json"))):
        rec = json.load(open(path))
        if not rec.get("is_current"):
            continue
        num, ours = rec["form_number"], rec["edition"]
        url = f"https://www.vba.va.gov/pubs/forms/VBA-{num}-ARE.pdf"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (edition check)"})
            with tempfile.NamedTemporaryFile(suffix=".pdf") as tmp:
                tmp.write(urllib.request.urlopen(req, timeout=60).read())
                tmp.flush()
                va = edition_of(tmp.name, num)
        except Exception as err:
            report("error", f"{num}: could not check {url} ({err})")
            failed = True
            continue
        if va is None:
            report("error", f"{num}: could not read the edition printed on {url}")
            failed = True
        elif va != ours:
            report("error", f"{num}: VA now publishes the {va} edition; we fill {ours}. Replace the template and rebuild its field map.")
            failed = True
        else:
            print(f"OK {num}: {ours} is VA's current edition")
            if rec.get("omb_expires"):
                exp = datetime.datetime.strptime(rec["omb_expires"], "%m/%d/%Y").date()
                if exp < today:
                    report("warning", f"{num}: printed OMB expiration {rec['omb_expires']} has passed, but VA still publishes this edition.")
                elif (exp - today).days <= WARN_DAYS:
                    report("warning", f"{num}: printed OMB expiration {rec['omb_expires']} is within {WARN_DAYS} days; expect a new edition.")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
