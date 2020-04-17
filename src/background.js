function sendCommandToTab(command, tab) {
  let targets = {
    'play-pause': ['play', 'pause'],
    'next': ['skip-forward'],
    'previous': ['skip-back'],
  }[command];
  if (!targets) return;
  const selector = targets.map(t => `.spoticon-${t}-16`).join(', ');
  const code = `document.querySelector("${selector}").click();`;
  chrome.tabs.executeScript(tab.id, { code });
}

chrome.commands.onCommand.addListener(function (command) {
  chrome.tabs.query({ url: 'https://open.spotify.com/*' }, function (tabs) {
    tabs.forEach(tab => sendCommandToTab(command, tab));
  });
});