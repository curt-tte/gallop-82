"""
Faithful text simulation of games/BLACKJK.txt (and web/blackjack.html) so you can
SEE Blackjack without a calculator. It mirrors the same rules:

  - infinite deck (each card drawn independently, rank 1-13)
  - face cards (J/Q/K) = 10, ace = 11 or 1 (soft-ace reduction)
  - dealer hits until reaching 17, then stands
  - blackjack pays 3:2 (web rule); even money otherwise
  - persistent-style bankroll passed between hands

This is a viewer/demo; the real games live in games/BLACKJK.txt and web/blackjack.html.
"""
import random

ROWS, COLS = 8, 16
RANK_STR = {1: "A", 11: "J", 12: "Q", 13: "K"}


class Screen:
    def __init__(self):
        self.grid = [[" "] * COLS for _ in range(ROWS)]

    def out(self, row, col, text):
        text = str(text)
        for i, ch in enumerate(text):
            c = col - 1 + i
            if 0 <= row - 1 < ROWS and 0 <= c < COLS:
                self.grid[row - 1][c] = ch

    def render(self, label=""):
        top = "+" + "-" * COLS + "+"
        lines = [top] + ["|" + "".join(r) + "|" for r in self.grid] + [top]
        if label:
            lines.append(label)
        return "\n".join(lines)


def rank_str(r):
    return RANK_STR.get(r, str(r))


def card_value(r):
    return 11 if r == 1 else 10 if r >= 11 else r


def hand_total(cards):
    t = sum(card_value(r) for r in cards)
    aces = sum(1 for r in cards if r == 1)
    while t > 21 and aces > 0:
        t -= 10
        aces -= 1
    return t


def is_blackjack(cards):
    return len(cards) == 2 and hand_total(cards) == 21


def hand_str(cards):
    return " ".join(rank_str(r) for r in cards)


def render_table(cash, bet, player, dealer, reveal, label):
    s = Screen()
    s.out(1, 1, ("BJ  CASH $" + str(cash))[:COLS])
    d_shown = hand_total(dealer) if reveal else card_value(dealer[0])
    s.out(3, 1, "DEALER  " + str(d_shown))
    s.out(4, 1, (" " + (hand_str(dealer) if reveal else rank_str(dealer[0]) + " ?"))[:COLS])
    s.out(6, 1, "YOU     " + str(hand_total(player)))
    s.out(7, 1, (" " + hand_str(player))[:COLS])
    print(s.render(label))
    print()


def play_hand(cash, bet, rng, hand_no):
    print("#" * 34)
    print(f" HAND {hand_no}  -  bet ${bet}")
    print("#" * 34 + "\n")
    cash -= bet
    player = [rng.randint(1, 13), rng.randint(1, 13)]
    dealer = [rng.randint(1, 13), rng.randint(1, 13)]

    # naturals
    pbj, dbj = is_blackjack(player), is_blackjack(dealer)
    if pbj or dbj:
        render_table(cash, bet, player, dealer, True, "--- DEAL (natural) ---")
        if pbj and dbj:
            cash += bet; return cash, "PUSH (both blackjack)"
        if pbj:
            cash += bet + bet * 3 // 2; return cash, "BLACKJACK! pays 3:2"
        return cash, "Dealer blackjack - you lose"

    # player strategy: hit while under 17 (simple demo bot)
    render_table(cash, bet, player, dealer, False, "--- YOUR TURN ---")
    while hand_total(player) < 17:
        player.append(rng.randint(1, 13))
        render_table(cash, bet, player, dealer, False, "--- HIT ---")
        if hand_total(player) > 21:
            return cash, "BUST - you lose"

    # dealer plays to 17
    render_table(cash, bet, player, dealer, True, "--- DEALER REVEALS ---")
    while hand_total(dealer) < 17:
        dealer.append(rng.randint(1, 13))
        render_table(cash, bet, player, dealer, True, "--- DEALER HITS ---")

    p, d = hand_total(player), hand_total(dealer)
    if d > 21:
        cash += bet * 2; return cash, "Dealer busts - you WIN"
    if p > d:
        cash += bet * 2; return cash, "You WIN"
    if p < d:
        return cash, "You lose"
    cash += bet; return cash, "PUSH"


if __name__ == "__main__":
    rng = random.Random(11)
    print("=" * 34)
    print(" BLACKJACK - TI-BASIC game (sim)")
    print("=" * 34 + "\n")
    cash = 100
    for n in range(1, 4):
        cash, outcome = play_hand(cash, 20, rng, n)
        print(f">> {outcome}.  Cash now: ${cash}\n")
