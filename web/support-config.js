/* Edit this file with your own payment details, then commit & deploy.
 *
 * Lightning address — easiest path. Works with Alby, Strike, Wallet of Satoshi,
 * Phoenix, etc. Example: "you@getalby.com"
 *
 * Nostr npub — enables zap buttons that open zap-capable clients (Primal, Snort,
 * Amethyst…). If you omit lightningAddress, we'll try to read lud16 from your
 * Nostr profile via nostr.band.
 *
 * nip05 — optional verified handle shown next to your npub (e.g. you@domain.com)
 */
window.GALLOP82_SUPPORT = {
  lightningAddress: "mythicshark63@zeuspay.com",          // e.g. "curt@getalby.com"
  npub: "npub1xntv335h3vwwtuw8d5hpk7tfusnffkj75aka0g7z77la90mplgxs2ew92g",                      // e.g. "npub1..."
  nip05: "",                     // optional
  zapNote: "Thanks for playing Gallop 82!",
  amazonTag: ""                  // optional affiliate tag for calculator links
};
