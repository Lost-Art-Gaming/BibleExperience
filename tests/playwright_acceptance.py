import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

BASE = 'http://127.0.0.1:4173/'
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'verification'
OUT.mkdir(exist_ok=True)

VIEWS = ['home', 'journey', 'timeline', 'explore', 'library']
SIZES = [(390, 844, 'mobile'), (1440, 900, 'desktop')]


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        for width, height, label in SIZES:
            context = await browser.new_context(viewport={'width': width, 'height': height})
            page = await context.new_page()
            console_errors = []
            page_errors = []
            page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)
            page.on('pageerror', lambda error: page_errors.append(str(error)))

            await page.goto(BASE + '#/home', wait_until='networkidle')
            await page.wait_for_selector('#main h1')

            for view in VIEWS:
                await page.goto(BASE + f'#/{"home" if view == "home" else view}', wait_until='networkidle')
                await page.wait_for_selector('#main h1')
                assert page.url.endswith(f'#/{view}'), page.url
                assert await page.locator('#main h1').evaluate('(el) => document.activeElement === el')
                if label == 'desktop':
                    assert await page.locator('.desktop-nav').evaluate("el => getComputedStyle(el).display !== 'none'")
                    assert await page.locator('.bottom-nav').evaluate("el => getComputedStyle(el).display === 'none'")
                else:
                    assert await page.locator('.bottom-nav').evaluate("el => getComputedStyle(el).display !== 'none'")
                await page.screenshot(path=str(OUT / f'{label}-{view}.png'), full_page=True)

            await page.goto(BASE + '#/episode/ep6', wait_until='networkidle')
            await page.wait_for_selector('.reader-head h1')
            assert page.url.endswith('#/episode/ep6'), page.url
            assert await page.locator('.reader-head h1').evaluate('(el) => document.activeElement === el')
            assert await page.locator('.reader-head').count() == 1
            assert await page.locator('.reader-head').evaluate("el => getComputedStyle(el).backgroundImage !== 'none'")
            assert await page.locator('.continue-btn').count() == 1
            assert await page.locator('.secondary-btn.next-link').count() == 1
            await page.screenshot(path=str(OUT / f'{label}-episode-ep6.png'), full_page=True)

            # Reader Back must return to the prior view when entered from Journey.
            await page.goto(BASE + '#/journey', wait_until='networkidle')
            await page.locator('[data-episode="ep6"]').click()
            await page.wait_for_selector('.reader-head h1')
            await page.locator('#readerBack').click()
            await page.wait_for_selector('#main h1')
            assert page.url.endswith('#/journey'), page.url

            # Search must trap focus and close on Escape.
            await page.goto(BASE + '#/home', wait_until='networkidle')
            await page.locator('#searchBtn').click()
            await page.wait_for_selector('#searchInput')
            await page.locator('#searchInput').fill('covenant')
            await page.wait_for_timeout(250)
            assert await page.locator('[data-result="ep10"]').count() >= 1
            await page.locator('#searchInput').press('Tab')
            await page.locator('.close-search').press('Shift+Tab')
            await page.keyboard.press('Escape')
            assert await page.locator('.search-overlay').count() == 0

            # Toggle the real light/dark state and ensure the icon label changes.
            before = await page.locator('#themeBtn').get_attribute('aria-label')
            await page.locator('#themeBtn').click()
            after = await page.locator('#themeBtn').get_attribute('aria-label')
            assert before != after

            # Wait for any late route/render work before judging errors.
            await page.wait_for_timeout(500)
            if console_errors or page_errors:
                raise AssertionError(f'{label} console/page errors: {console_errors + page_errors}')

            await context.close()
        await browser.close()


if __name__ == '__main__':
    asyncio.run(main())
