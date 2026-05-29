#!/usr/bin/env python3
"""Sanity-check TI-BASIC control flow for every program in games/.

On a TI calculator, three things open a block that must be closed by End:
  - For(
  - While
  - Repeat
  - an If whose body is a Then ... End block (we detect the `Then` token)

A plain `If condition` with the statement on the next line runs exactly one
line and needs NO End. So the number of End tokens must equal:
    Then + For( + While + Repeat

This won't catch every logic bug, but it reliably flags the most common
TI-BASIC mistake: a missing or stray End.
"""
import os
import re
import sys

GAMES_DIR = os.path.join(os.path.dirname(__file__), "..", "games")


def tokens(line):
    # strip the leading ":" command marker TI uses on each line
    return line.lstrip(":").strip()


def check(path):
    fors = whiles = repeats = thens = ends = 0
    with open(path, "r", encoding="utf-8") as f:
        for raw in f:
            s = tokens(raw)
            fors += len(re.findall(r"\bFor\(", s))
            whiles += len(re.findall(r"\bWhile\b", s))
            repeats += len(re.findall(r"\bRepeat\b", s))
            thens += len(re.findall(r"\bThen\b", s))
            # End as a standalone statement (not e.g. a variable name)
            if s == "End" or s.startswith("End"):
                ends += 1
    needed = fors + whiles + repeats + thens
    ok = needed == ends
    return ok, dict(For=fors, While=whiles, Repeat=repeats,
                    Then=thens, End=ends, needed=needed)


def main():
    ok_all = True
    for name in sorted(os.listdir(GAMES_DIR)):
        if not name.endswith(".txt"):
            continue
        ok, stats = check(os.path.join(GAMES_DIR, name))
        flag = "OK " if ok else "BAD"
        if not ok:
            ok_all = False
        print(f"[{flag}] {name:14s} End={stats['End']:2d} "
              f"needed={stats['needed']:2d} "
              f"(For={stats['For']} While={stats['While']} "
              f"Repeat={stats['Repeat']} Then={stats['Then']})")
    print()
    print("All programs balanced." if ok_all else "FOUND IMBALANCE -- review above.")
    return 0 if ok_all else 1


if __name__ == "__main__":
    sys.exit(main())
