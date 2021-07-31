# Spotify Web hotkeys

Install from the [Chrome Web Store](https://chrome.google.com/webstore/detail/spotify-web-player-hotkey/pdcbjjmgfakcbbchppeemlfpfgkdmjji).

Adds the following default keyboard shortcuts to https://open.spotify.com:

* *Play/Pause* media key: play, pause
* *Previous* media key: previous track
* *Next* media key: next track

There is no default shortcut, but you can also bind keys for:

* Toggle shuffle
* Toggle repeat (single song, whole playlist, disabled)
* Toggle song like
* Seek podcast backward
* Seek podcast forward

You can customize these shortcuts and make them global hotkeys (not just while displaying Spotify) by opening `chrome://extensions/shortcuts`.

**Warning**: Chrome/Chromium is known to not correctly register hotkeys after you've changed them in `chrome://extensions/shortcuts`. Please restart your browser by visiting `chrome://restart` after changes to shortcuts/hotkeys.

This extension relies on the HTML/CSS structure of the website.
Spotify might break it by changing their frontend.

The code is [short and simple](/src/background.js).

## License

MIT.
