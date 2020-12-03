function sendCommandToTab(command, tab) {
  // Some buttons have a convenient CSS class. Use that to find it and click.
  function usingClass(command) {
    const targets = {
      'play-pause': ['play', 'pause'],
      'next': ['skip-forward'],
      'previous': ['skip-back'],
      'shuffle': ['shuffle'],
      'repeat': ['repeat', 'repeatonce'],
      'like': ['heart', 'heart-active'],
    }[command];
    if (!targets) return null;
    const sel = targets.map(t => `.control-button.spoticon-${t}-16`).join(', ');
    return `
      (function () {
        const e = document.querySelector("${sel}");
        if (!e) throw "";
        e.click();
      })`;
  }

  // A Very Cursed search for a specific iconography using CSS <path> d=
  // attribute. Then go up the DOM tree to find the parent button and click.
  function usingSvg(command) {
    const paths = {
      'previous': ['M13 2.5L5 7.119V3H3v10h2V8.881l8 4.619z'],
      'play-pause': ['M0 0h16v16H0z', 'M4.018 14L14.41 8 4.018 2z'],
      'next': ['M11 3v4.119L3 2.5v11l8-4.619V13h2V3z'],
    }[command];
    if (!paths) return null;
    const sel = paths.map(p => `.player-controls path[d="${p}"]`).join(', ');
    return `
      (function () {
        let e = document.querySelector('${sel}');
        if (!e) throw "";
        while (e && e.tagName.toLowerCase() !== "button") e = e.parentNode;
        if (!e) throw "";
        e.click();
      })`;
  }

  // Let's have multiple methods to find the right button, because Spotify
  // decided front-end development was more exciting with randomized CSS
  // classes... but not for all UI elements of course. Yay, consistency!
  const codes = [usingClass, usingSvg].map(e => e.call(this, command)).filter(e => !!e);

  // No method available for that command. Bail out.
  if (!codes.length) {
    console.error(`nothing to do for ${command}`);
    return;
  }

  // Use some reduce() smartness to use each method one after the other.
  // Each method shoud throw to communicate that it failed to click its button.
  // Use 'return;' to stop at the first successful method.
  const tryCascade = codes.reverse().reduce(
    (acc, fun) => `try { ${fun}(); return; } catch (_) { ${acc} }`,
    '');
  // Wrap inside a function to allow for the early 'return;' above.
  const code = `(function () { ${tryCascade} })();`;
  chrome.tabs.executeScript(tab.id, { code });
}

chrome.commands.onCommand.addListener(function (command) {
  chrome.tabs.query({ url: 'https://open.spotify.com/*' }, function (tabs) {
    tabs.forEach(tab => sendCommandToTab(command, tab));
  });
});
