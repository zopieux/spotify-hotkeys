/**
 * Browses Spotify in Puppeteer and cycles through a bunch of states to capture button appearance and SVGs.
 */

import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import {imgDiff} from 'img-diff-js';
import {diffString, diff} from 'json-diff';

const kSongOrder = {
  like: 0,
  shuffle: 1,
  previous: 2,
  play: 3,
  next: 4,
  repeat: 5,
};

const kPodcastOrder = {
  like: 0,
  seekBackward: 1,
  previous: 2,
  play: 3,
  next: 4,
  seekForward: 5,
};

const kPlayBarSelector = 'footer[data-testid="now-playing-bar"]';

function sleep(s) {
  return new Promise(resolve => setTimeout(resolve, s * 1000));
}

async function setCookies(page, cookies) {
  for (let [name, value] of cookies) {
    await page.setCookie({
      name, value,
      domain: ".spotify.com",
      path: "/",
    });
  }
}

async function createPuppeteer() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: {width: 1280, height: 900},
    args: [
      '--autoplay-policy=no-user-gesture-required',
      '--audio-output-channels=2',
    ],
    executablePath: process.env['CHROME_BIN'],
  });
  return await browser.newPage();
}

async function waitForLicense(page) {
  await page.waitForRequest(r => r.url().includes('/v1/audio/license'), {timeout: 3000});
}

async function waitForProxyCast(page) {
  await page.waitForRequest(r => r.url().includes('rf.proxycast.org'), {timeout: 3000});
}

async function screenshotEl(page, el, name) {
  const box = await el.boundingBox();
  const x = box['x'], y = box['y'], width = box['width'], height = box['height'];
  await page.screenshot({type: 'png', path: `/tmp/${name}.png`, clip: {x, y, width, height}});
}

async function dumpSvg(el) {
  const svg = await el.$('svg');
  const content = await svg.getProperty('innerHTML');
  return await content.jsonValue();
}

async function dumpEl(page, el, name, into) {
  await screenshotEl(page, el, name);
  if (typeof into === 'object') into[name] = await dumpSvg(el);
}

async function consentCookies(page) {
  const btn = await page.waitForSelector('.onetrust-close-btn-ui, #onetrust-accept-btn-handler');
  await sleep(1);
  await btn.click(clickOpts());
  await sleep(2);
}

async function getButtons(page) {
  const buttons = [...(await page.$$(`${kPlayBarSelector} button`))];
  buttons.splice(0, 1);
  return buttons;
}

function clickOpts() {
  return {delay: Math.random() * 84 + 21};
}

async function songStates(page, svgs) {
  // Start playing a normal, liked song (since we're in Liked Songs).
  {
    const btn = await page.waitForSelector('[data-testid="action-bar-row"] [data-testid="play-button"]');
    await btn.click(clickOpts());
  }
  await waitForLicense(page);
  await sleep(2);

  const playBarEl = await page.waitForSelector(kPlayBarSelector);
  await dumpEl(page, playBarEl, 'playbar-song-playing');

  const buttons = await getButtons(page);
  await dumpEl(page, buttons[kSongOrder.like], 'btn-song-like-liked', svgs);
  await dumpEl(page, buttons[kSongOrder.play], 'btn-song-play-playing', svgs);
  await dumpEl(page, buttons[kSongOrder.shuffle], 'btn-song-shuffle-off', svgs);
  await dumpEl(page, buttons[kSongOrder.previous], 'btn-song-previous', svgs);
  await dumpEl(page, buttons[kSongOrder.next], 'btn-song-next', svgs);
  await dumpEl(page, buttons[kSongOrder.repeat], 'btn-song-repeat-off', svgs);

  {
    // Un-like.
    const btn = buttons[kSongOrder.like];
    await btn.click(clickOpts());
    await sleep(2);
    await dumpEl(page, btn, 'btn-song-like-unliked', svgs);
    // Like.
    await btn.click(clickOpts());
    await sleep(2);
  }

  {
    // Shuffle on.
    const btn = buttons[kSongOrder.shuffle];
    await btn.click(clickOpts());
    await sleep(2);
    await dumpEl(page, btn, 'btn-song-shuffle-on', svgs);
    // Shuffle off.
    await btn.click(clickOpts());
    await sleep(2);
  }

  {
    // Repeat all.
    const btn = buttons[kSongOrder.repeat];
    await btn.click(clickOpts());
    await sleep(2);
    await dumpEl(page, btn, 'btn-song-repeat-all', svgs);
    // Repeat once.
    await btn.click(clickOpts());
    await sleep(2);
    await dumpEl(page, btn, 'btn-song-repeat-once', svgs);
    // Repeat off.
    await btn.click(clickOpts());
    await sleep(2);
  }

  // Pause.
  await page.keyboard.press('Space');
  await sleep(2);
  await dumpEl(page, buttons[kSongOrder.play], 'btn-song-play-paused', svgs);
}

async function podcastStates(page, svgs) {
  {
    const btn = await page.waitForSelector('[data-testid="infinite-scroll-list"] [data-testid="play-button"]');
    await btn.click(clickOpts());
  }
  await waitForProxyCast(page);
  await sleep(2);

  const playBarEl = await page.waitForSelector(kPlayBarSelector);
  await dumpEl(page, playBarEl, 'playbar-podcast-playing');

  const buttons = await getButtons(page);
  await dumpEl(page, buttons[kPodcastOrder.like], 'btn-podcast-like-unliked', svgs);
  await dumpEl(page, buttons[kPodcastOrder.seekBackward], 'btn-podcast-seed-backward', svgs);
  await dumpEl(page, buttons[kPodcastOrder.seekForward], 'btn-podcast-seed-forward', svgs);

  {
    // Like.
    const btn = buttons[kPodcastOrder.like];
    await btn.click(clickOpts());
    await sleep(2);
    await dumpEl(page, btn, 'btn-podcast-like-liked', svgs);
    // Un-like.
    await btn.click(clickOpts());
    await sleep(2);
  }

  // Previous to reset state.
  buttons[kPodcastOrder.previous].click(clickOpts());
  await sleep(1);

  // Pause.
  await page.keyboard.press('Space');
  await sleep(1);
}

async function dumpImagesAndSvg() {
  const page = await createPuppeteer();
  page.setDefaultTimeout(12000);
  page.setDefaultNavigationTimeout(20000);

  const cookies = ['sp_t', 'sp_dc'].map(name => [name, process.env[`SPOT_${name.toUpperCase()}`]]);
  await setCookies(page, cookies);

  const svgs = {};

  // Load Liked Songs.
  await page.goto('https://open.spotify.com/collection/tracks');
  await sleep(3);
  await consentCookies(page);
  await songStates(page, svgs);

  // Load a podcast tracklist.
  await page.goto('https://open.spotify.com/show/6yjJ4a0KjG5IewFi2NiORi');
  await sleep(1);
  await podcastStates(page, svgs);

  fs.writeFileSync('/tmp/svg.json', JSON.stringify(svgs));

  await page.browser().close();
}

async function compareWithGolden() {
  let hasDiff = false;

  for (const name of fs.readdirSync('./golden/')) {
    const expected = `./golden/${name}`;
    const actual = `/tmp/${name}`;

    if (name.endsWith('.png')) {
      const diff = await imgDiff({
        actualFilename: actual,
        expectedFilename: expected,
        diffFilename: `/tmp/diff-${name}`,
        generateOnlyDiffFile: true,
      });
      if (!diff.imagesAreSame) {
        hasDiff = true;
        console.log("images are different:", name);
        console.log(diff);
      }
    } else if (name.endsWith('.json')) {
      const diff = diffString(JSON.parse(fs.readFileSync(expected, 'utf8')), JSON.parse(fs.readFileSync(actual, 'utf8')), {color: true});
      if (diff !== '') {
        hasDiff = true;
        console.log("JSONs are different:", name);
        console.log(diff);
      }
    } else {
      throw new Error('unknown extension for diffing');
    }
  }

  return hasDiff;
}

(async () => {
  await dumpImagesAndSvg();
  const hasDiff = await compareWithGolden();
  if (hasDiff) process.exit(1);
})();
