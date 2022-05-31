const assert = require("assert");
const { Builder, By, until } = require("selenium-webdriver");
const webdriver = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const path = require("chromedriver").path;
const { expect } = require("chai");
const exp = require("constants");
const { test } = require("mocha");

describe("Gala Games", () => {
  let driver;

  before(async () => {
    // Stand up the webdriver before the start of any test
    const service = new chrome.ServiceBuilder(path).build();
    chrome.setDefaultService(service);
    driver = new webdriver.Builder()
      .withCapabilities(webdriver.Capabilities.chrome())
      .build();
  });

  after(async () => driver.quit());

  it("load website and verify the title", async () => {
    await driver.get("https://app.gala.games/games");
    await dismissPrivacySettings();

    // await driver.findElement(By.name('q')).sendKeys('nehalist', Key.ENTER);
    // await driver.wait(until.elementLocated(By.id('search')));
    // await driver.findElement(By.linkText('nehalist.io')).click();
    const title = await driver.getTitle();
    expect(title).to.equal("Gala Games");
  });

  it("from the Games page I should not be able to launch Town Star without being logged in", async () => {
    await driver.get("https://app.gala.games/games");
    await dismissPrivacySettings();

    // chai .throw was not working with the await above so using this hack to check that the sign in dialog is not
    // present when first opening the page
    try {
      const dialog = await driver.findElement(
        By.className(
          "v-dialog register-dialog v-dialog--active v-dialog--persistent"
        )
      );
    } catch (err) {
      expect(err.name).equals("NoSuchElementError");
    }

    // scroll Town Star container into view
    const element = await driver.findElement(By.css('[alt="Town Star"]'));
    await driver.executeScript('arguments[0].scrollIntoViewIfNeeded(true);', element);

    // find and click play button
    const button = await driver.findElement(By.css('#app > div.v-application--wrap > main > div > div > div.pt-14.games-container > div:nth-child(6) > div > div.flex.xs12.md6.xl5 > div > div.buttons > div.action-button-container.action-btn > button'));
    await button.click();

    // wait for register prompt to appear
    await driver.sleep(3000);
    const dialog = await driver.findElement(
      By.className(
        "v-dialog register-dialog v-dialog--active v-dialog--persistent"
      )
    );
    expect(dialog).to.exist;
  });

  it("from the Store page Search for an item of your choice", async () => {
    await driver.get("https://app.gala.games/store");
    await dismissPrivacySettings();

    const inputField = await driver.findElement(By.css('#app > div > main > div > div > div:nth-child(2) > div > div.col.col-12 > div > div.search-bar.d-flex.pa-2 > input[type=text]'));
    await inputField.click();
    await inputField.sendKeys('love');
    await inputField.sendKeys(webdriver.Key.RETURN);
    await driver.sleep(2000);
    const cardsFound = await driver.executeScript('return document.querySelector("#app > div > main > div > div > div:nth-child(2) > div > div.col-md-8.col-lg-9.col-12 > div").childElementCount');

    // one card should be found
    expect(await getCardsVisible()).equal(1);
  });

  it("from the Store page I should be able to filter Town Star items by Epic Rarity", async () => {
    await driver.get("https://app.gala.games/store");
    await dismissPrivacySettings();

    // select town star game
    const gameElement = await driver.findElement(By.css('#app > div > main > div > div > div:nth-child(2) > div > div.col-md-4.col-lg-3.col > div > div > div:nth-child(1) > div > div > div:nth-child(7) > p'));
    await driver.executeScript('arguments[0].scrollIntoViewIfNeeded(true);', gameElement);
    await gameElement.click();
    await driver.sleep(2000);

    // select epic rarity
    const epicElement = await driver.findElement(By.css('#app > div > main > div > div > div:nth-child(2) > div > div.col-md-4.col-lg-3.col > div > div > div:nth-child(2) > div > div > div:nth-child(4) > div > i'));
    await driver.executeScript('arguments[0].scrollIntoViewIfNeeded(true);', gameElement);
    await epicElement.click();
    await driver.sleep(2000);

    // 0 cards should be found
    expect(await getCardsVisible()).equal(0);
  });

  it("from the Store page I should be able to filter Spider Tank items by Rare Rarity", async () => {
    await driver.get("https://app.gala.games/store");
    await dismissPrivacySettings();

    // spider tanks star game
    const gameElement = await driver.findElement(By.css('#app > div > main > div > div > div:nth-child(2) > div > div.col-md-4.col-lg-3.col > div > div > div:nth-child(1) > div > div > div:nth-child(5)'));
    await driver.executeScript('arguments[0].scrollIntoViewIfNeeded(true);', gameElement);
    await gameElement.click();
    await driver.sleep(2000);

    // select rare rarity
    const epicElement = await driver.findElement(By.css('#app > div > main > div > div > div:nth-child(2) > div > div.col-md-4.col-lg-3.col > div > div > div:nth-child(2) > div > div > div:nth-child(3) > div > i'));
    await driver.executeScript('arguments[0].scrollIntoViewIfNeeded(true);', gameElement);
    await epicElement.click();
    await driver.sleep(2000);

    // 29 cards should be found
    expect(await getCardsVisible()).equal(29);
  });

  const dismissPrivacySettings = async () => {
    // load website first and wait 3 seconds for the Privacy Settings to possible appear
    // this does not always happen so we'll run this at the start of the test
    await driver.sleep(3000);
    // delete the panel if it exists
    // finding and actually clicking the deny or accept buttons was getting tricky with
    // the shadow root - this is easier for now
    await driver.executeScript('document.getElementById("usercentrics-root").remove();');
    await driver.sleep(2000);
  }

  const getCardsVisible = async () => {
    const script =
      `return (function() {
        var list = document.querySelector("#app > div > main > div > div > div:nth-child(2) > div > div.col-md-8.col-lg-9.col-12 > div").children;
        var counter = 0;
        list.forEach((element) => {
            if (element.className === "col-lg-4 col-xl-3 col-6") {
                counter++;
            }
        });
        return counter;
    })()`;
    return driver.executeScript(script);
  }
});

