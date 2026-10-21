"""Writes input_builder_notes.js - the note the builder shows under each key - from the notes text file.

    python3 docs/javascripts/make_builder_notes.py ~/Downloads/mpm3s_builder_notes.txt

The text file has one heading per key, giving its place in the input file ("## domain › gravity"), with the
note on the lines below it (blank = no note). Anything after four spaces and a "(" on a heading line is a
remark, and everything above the first heading is ignored.
"""
import json
import re
import sys
from pathlib import Path

OUT = Path(__file__).with_name("input_builder_notes.js")


def read(path):
    notes, key, body = {}, None, []
    for line in Path(path).expanduser().read_text(encoding="utf-8").splitlines():
        if line.startswith("#"):
            if key is not None:
                notes[key] = " ".join(x.strip() for x in body if x.strip())
            key, body = re.sub(r"^#+\s*", "", line).split("    (")[0].strip(), []
        elif key is not None:
            body.append(line)
    if key is not None:
        notes[key] = " ".join(x.strip() for x in body if x.strip())
    return notes


def main():
    notes = read(sys.argv[1] if len(sys.argv) > 1 else "~/Downloads/mpm3s_builder_notes.txt")
    lines = ["/* The note under each key of the interactive builder, by its place in the input file (input_builder.js).",
             "   Written by make_builder_notes.py from the notes text file: edit that and run it again. */",
             "window.MPM3S_NOTES = {"]
    lines += [f"  {json.dumps(k, ensure_ascii=False)}: {json.dumps(v, ensure_ascii=False)}," for k, v in notes.items()]
    lines.append("};")
    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"{len(notes)} notes -> {OUT}")


if __name__ == "__main__":
    main()
