function sendCommandToTab(command, tab) {
  let targets = {
    'play-pause': ['play', 'pause'],
    'next': ['skip-forward'],
    'previous': ['skip-back'],
    'shuffle': ['shuffle'],
    'repeat': ['repeat', 'repeatonce'],
    'like': ['heart', 'heart-active'],
  }[command];
  if (!targets) return;
  const selector = targets.map(t => `.control-button.spoticon-${t}-16`).join(', ');
  const code = `document.querySelector("${selector}").click();`;
  chrome.tabs.executeScript(tab.id, { code });
}

chrome.commands.onCommand.addListener(function (command) {
  chrome.tabs.query({ url: 'https://open.spotify.com/*' }, function (tabs) {
    tabs.forEach(tab => sendCommandToTab(command, tab));
  });
});
