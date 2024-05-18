# Spotify Web Player Hotkeys

<p align="center">

[![Install from Chrome Web Store](.github/chromewebstore.png)](https://chrome.google.com/webstore/detail/spotify-web-player-hotkey/pdcbjjmgfakcbbchppeemlfpfgkdmjji)

[Install from Chrome Web Store](https://chrome.google.com/webstore/detail/spotify-web-player-hotkey/pdcbjjmgfakcbbchppeemlfpfgkdmjji)

</p>

Adds the following default keyboard shortcuts to https://open.spotify.com:

* *Play/Pause* media key: play, pause – opens a Spotify tab Spotify if necessary!
* *Previous* media key: previous track
* *Next* media key: next track

There is no default shortcut, but you can also bind keys for:

* Navigating to the home page or the search page – opens a Spotify tab if necessary!
* Toggle shuffle
* Toggle repeat (single song, whole playlist, disabled)
* Toggle song like (since 2024, requires focusing the browser tab)
* Toggle showing the queue sidebar
* Toggle showing "now playing" sidebar
* Toggle showing lyrics
* Increase, decrease & mute volume
* Seek backward & forward in both songs (±5 seconds) and podcasts (±15 seconds)

You can customize these shortcuts and make them global hotkeys (not just while displaying Spotify) by opening `chrome://extensions/shortcuts` or clicking the extension icon.

**Warning**: Chrome/Chromium is known to not correctly register hotkeys after you've changed them in `chrome://extensions/shortcuts`. Please restart your browser by visiting `chrome://restart` after changes to shortcuts/hotkeys.

This extension relies on the HTML/CSS structure of the website.
Spotify might break it by changing their frontend.

The code is [short and simple](/src/background.js).

## License

MIT.

## Thanks!

I'd like to thank GitHub users:

* https://github.com/Architectuur for making me aware of the Podcast seek buttons
* https://github.com/CyanSlinky for suggesting volume shortcuts in issue #12
* https://github.com/frypf for the non-trivial improvments implemented in pull-request #15
* https://github.com/jsauder2 for reporting issue #7
* https://github.com/kumaxim for contributing a fix
* https://github.com/mmeowmeow for providing the fix to issue #16
* https://github.com/msp26 for reporting issue #3
* https://github.com/neviln for suggesting generalized seek shortcuts (not just podcasts) in issue #13
* https://github.com/shie1d3d for providing valuable data to fix issue #10
* https://github.com/smurfvindaloo for reporting issue #16
