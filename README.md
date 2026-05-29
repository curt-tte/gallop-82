# Gallop 82

A small collection of games written in **TI-BASIC**, the programming language
built into TI graphing calculators &mdash; headlined by **Horse Racing**, with a
polished browser version you can play without a calculator.

Everything here is written to run on the **TI-82** (the most limited model in the
family), which means it also runs unchanged on the **TI-83 / TI-83+ / TI-84+ / TI-84+ CE**.

## Games

| Program    | File                     | Description                                              |
|------------|--------------------------|----------------------------------------------------------|
| `NUMGUESS` | `games/NUMGUESS.txt`     | Guess the secret number (1-100) in as few tries as possible. |
| `DODGE`    | `games/DODGE.txt`        | Real-time arcade: slide left/right and dodge falling rocks. |
| `TICTAC`   | `games/TICTAC.txt`       | Two-player Tic-Tac-Toe on the home screen.               |
| `HORSE`    | `games/HORSE.txt`        | Betting parlor: pick 2-6 horses with speeds/odds, wager your cash, race, repeat. |
| `SNAKE`    | `games/SNAKE.txt`        | The classic: eat `X`, grow longer, don't hit the walls or yourself. |
| `BLACKJK`  | `games/BLACKJK.txt`      | Blackjack vs the dealer: hit/stand, soft aces, persistent cash. |
| `PONG`     | `games/PONG.txt`         | Volley against the CPU paddle; first to 5 points wins.   |
| `CONNECT4` | `games/CONNECT4.txt`     | Two-player Connect Four on a 6x7 board (uses matrix `[A]`). |
| `SIMON`    | `games/SIMON.txt`        | Memory game: repeat the growing sequence with keys `1`-`4` (uses list `L1`). |

## TI-82 compatibility notes

The TI-82 is missing features that later models added, so these programs deliberately:

- Use `int(N*rand)+1` instead of `randInt(` (which doesn't exist on the 82).
- Avoid string variables (`Str1`...), which the 82 lacks.
- Use only uppercase text.
- Use only commands present in the original 82 OS (`Output(`, `getKey`, `Disp`,
  `Input`, `If/Then/End`, `While`, `Repeat`, `Menu(`, etc.).

A couple of source-notation tips for typing these in:

- `->` is the **STO** key (the `→` arrow).
- A leading `-` (as in `-1->U` inside `SNAKE`) is the **negate key** `(-)`, *not* the
  blue subtraction `-` key. Tokenizers like SourceCoder handle either correctly.
- `SNAKE` uses matrix `[A]` and lists `L1`/`L2` as its game board and body; running
  it will overwrite those. (`[A]` is pasted from `2nd` `MATRX`.)

## getKey codes used

`getKey` returns `0` when no key is pressed (so loops keep running in real time):

```
 Up    = 25      Left  = 24      CLEAR = 45
 Down  = 34      Right = 26      ENTER = 105
 1     = 92      2     = 93      3     = 94      4 = 82
```

`SIMON` reads the number keys `1`-`4` (codes above). `CONNECT4` uses the matrix
`[A]` as its board, and `SIMON` uses list `L1` for its sequence &mdash; running them
overwrites those.

## How to get these onto a calculator

The `.txt` files are human-readable source — exactly what you see in the calculator's
program editor. You have two options:

### Option A — Type it in by hand
1. On the calculator: `PRGM` -> `NEW` -> name it (e.g. `DODGE`).
2. Type the program in line by line.
   - `->` in these files is the **STO key** (the arrow `→`).
   - Commands like `Output(`, `If`, `Disp` are pasted from menus (`PRGM` button),
     **not** typed letter by letter.

### Option B — Convert + transfer from a computer (recommended)
1. Open [**SourceCoder 3**](https://www.cemetech.net/sc/) (free, in-browser).
2. Paste a program's text, then export it as an `.8xp` file.
3. Send the `.8xp` to the calculator with **TI Connect CE** and a USB cable.

## How to play

On the calculator: press `PRGM`, choose the program name, then `ENTER`.

To stop a running program at any time, press the `ON` key.
