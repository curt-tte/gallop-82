"""
Faithful simulation of games/HORSE.txt so you can SEE the game without a
calculator. It mirrors the TI-BASIC logic exactly:

  - 16 columns x 8 rows home screen (Output(row,col,...))
  - speeds L2(I) = int(3*rand)+2  -> 2..4
  - payout multiplier = 6 - speed -> 4,3,2
  - advance per frame = int(speed*rand)
  - finish when position >= 14 (drawn at column position+2 -> col 16)
  - 10% house take on winnings, persistent BALANCE (M) and BEST (N)

This is just a viewer/demo; the real game lives in games/HORSE.txt.
"""
import random
import time

ROWS, COLS = 8, 16


class Screen:
    def __init__(self):
        self.grid = [[" "] * COLS for _ in range(ROWS)]

    def output(self, row, col, text):
        text = str(text)
        for i, ch in enumerate(text):
            c = col - 1 + i
            if 0 <= row - 1 < ROWS and 0 <= c < COLS:
                self.grid[row - 1][c] = ch

    def clr(self):
        self.grid = [[" "] * COLS for _ in range(ROWS)]

    def render(self, label=""):
        top = "+" + "-" * COLS + "+"
        lines = [top]
        for r in self.grid:
            lines.append("|" + "".join(r) + "|")
        lines.append(top)
        if label:
            lines.append(label)
        return "\n".join(lines)


def ti_int(x):
    import math
    return math.floor(x)


def race(num_horses, bet, wager, M, N, seed=None, frame_delay=0.0, show_frames=True):
    rng = random.Random(seed)

    # ---- lineup screen (rows 1..H) ----
    L1 = [0] * (num_horses + 1)  # positions (1-indexed)
    L2 = [0] * (num_horses + 1)  # speeds
    s = Screen()
    if M > N:
        N = M
    for I in range(1, num_horses + 1):
        L2[I] = ti_int(3 * rng.random()) + 2
        L1[I] = 2
        s.output(I, 1, I)
        s.output(I, 3, "SPD")
        s.output(I, 6, L2[I])
        s.output(I, 9, "PAYS X")
        s.output(I, 15, 6 - L2[I])
    print(s.render("--- PADDOCK: pick your horse ---"))
    print(f"BALANCE ${M}   BEST ${N}")
    print(f">> You bet HORSE {bet} for ${wager} (pays x{6 - L2[bet]})\n")

    M -= wager  # M-G->M

    # ---- race ----
    W = 0
    photo = False
    frame = 0
    while W == 0:
        frame += 1
        raw = [0] * (num_horses + 1)  # uncapped distance, for a fair finish order
        for I in range(1, num_horses + 1):
            L1[I] += ti_int(L2[I] * rng.random())
            raw[I] = L1[I]
            if L1[I] > 14:
                L1[I] = 14  # cap to the finish line for drawing
        # winner = horse that lunged FURTHEST past the line (ties broken at random)
        crossers = [I for I in range(1, num_horses + 1) if raw[I] >= 14]
        if crossers:
            best = max(raw[I] for I in crossers)
            W = rng.choice([I for I in crossers if raw[I] == best])
            photo = len(crossers) > 1
        if show_frames:
            s.clr()
            s.output(1, 1, "BET H")
            s.output(1, 6, bet)
            s.output(1, 9, "$")
            s.output(1, 10, wager)
            for I in range(1, num_horses + 1):
                s.output(I + 1, 1, I)
                s.output(I + 1, L1[I] + 2, "Q")
            if frame % 3 == 0 or W != 0:  # sample frames to keep it readable
                print(s.render(f"--- RACE (frame {frame}) ---"))
                print()
                time.sleep(frame_delay)

    # ---- result ----
    s.clr()
    if photo:
        s.output(1, 1, "PHOTO FINISH!")
        s.output(2, 1, "HORSE")
        s.output(2, 7, W)
        s.output(2, 9, "WINS")
    else:
        s.output(1, 1, "WINNER: HORSE")
        s.output(1, 14, W)
    if W == bet:
        P = wager * (6 - L2[bet])
        T = ti_int(P / 10)
        M += P - T
        s.output(3, 1, "YOU WIN!")
        s.output(4, 1, "PAID $")
        s.output(4, 7, P - T)
        s.output(5, 1, "TAKE $")
        s.output(5, 7, T)
    else:
        s.output(3, 1, "YOU LOSE")
        if photo:
            s.output(4, 1, "BY A NOSE!")
    if M > N:
        N = M
    s.output(6, 1, "BALANCE $")
    s.output(6, 11, M)
    s.output(7, 1, "BEST $")
    s.output(7, 7, N)
    print(s.render("--- RESULT ---"))
    if photo:
        print(f">> Photo finish! Multiple horses crossed on the same stride, so the "
              f"win went to horse {W} \u2014 the one that lunged furthest past the line.")
    return M, N


if __name__ == "__main__":
    M, N = 100, 0
    print("=" * 34)
    print(" HORSE - TI-BASIC game (simulated)")
    print("=" * 34 + "\n")

    # Race 1: bet the favorite-ish horse 2, wager 20
    M, N = race(num_horses=4, bet=2, wager=20, M=M, N=N, seed=7)
    print("\n" + "#" * 34 + "\n")
    # Race 2: bet a long shot, bigger wager
    M, N = race(num_horses=4, bet=3, wager=40, M=M, N=N, seed=3)
