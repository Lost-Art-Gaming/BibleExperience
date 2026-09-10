import asyncio
import os
from pathlib import Path
from playwright.async_api import async_playwright

# `localhost` (rather than the 127.0.0.1 literal) so this resolves whether
# `vite preview`'s default host binds IPv4-only, IPv6-only, or dual-stack —
# observed to differ between this Windows dev machine (IPv6-only) and Ubuntu
# CI runners (typically dual-stack).
BASE = 'http://localhost:4173/BibleExperience/'
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'verification'
OUT.mkdir(exist_ok=True)

VIEWS = ['home', 'journey', 'timeline', 'explore', 'library']
SIZES = [(390, 844, 'mobile'), (1440, 900, 'desktop')]

# Prefer Playwright's own bundled Chromium (works on Windows dev machines and
# in CI once `playwright install chromium` has run). Only fall back to a
# system Chromium path when one is explicitly provided via env var, which is
# how CI images that ship their own browser can still opt in.
LAUNCH_KWARGS = {'headless': True, 'args': ['--no-sandbox']}
if os.environ.get('PLAYWRIGHT_CHROMIUM_PATH'):
    LAUNCH_KWARGS['executable_path'] = os.environ['PLAYWRIGHT_CHROMIUM_PATH']


async def wait_for_focus(page, selector, timeout=5000):
    """Wait until `selector`'s element is document.activeElement.

    The app's route-change focus (src/components/PageTransition.tsx,
    FocusHeading) moves focus inside a requestAnimationFrame callback after
    mount, not synchronously — so a plain existence check for the element
    can win a race against the focus call. Poll instead of asserting once.
    """
    await page.wait_for_function(
        """(sel) => {
            const el = document.querySelector(sel);
            return !!el && document.activeElement === el;
        }""",
        arg=selector,
        timeout=timeout,
    )


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(**LAUNCH_KWARGS)
        for width, height, label in SIZES:
            context = await browser.new_context(viewport={'width': width, 'height': height})
            page = await context.new_page()
            console_errors = []
            page_errors = []
            page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)
            page.on('pageerror', lambda error: page_errors.append(str(error)))

            await page.goto(BASE + '#/', wait_until='networkidle')
            await page.wait_for_selector('#main h1')

            for view in VIEWS:
                # Home is React Router's index route ("/"), not an explicit
                # "/home" path — the nav (src/components/Nav.tsx) always
                # links there as "/", and an unmatched "#/home" hash falls
                # through the app's catch-all route and redirects to "/".
                target_path = '' if view == 'home' else view
                await page.goto(BASE + f'#/{target_path}', wait_until='networkidle')
                await page.wait_for_selector('#main h1')
                assert page.url.endswith(f'#/{target_path}'), page.url
                await wait_for_focus(page, '#main h1')
                if label == 'desktop':
                    assert await page.locator('.desktop-nav').evaluate("el => getComputedStyle(el).display !== 'none'")
                    assert await page.locator('.bottom-nav').evaluate("el => getComputedStyle(el).display === 'none'")
                else:
                    assert await page.locator('.bottom-nav').evaluate("el => getComputedStyle(el).display !== 'none'")

                if view == 'explore':
                    # Headless Chromium may not expose WebGL, so the 3D scene
                    # can legitimately render either the <canvas> or the
                    # static `.three-fallback` — accept either.
                    canvas_count = await page.locator('canvas').count()
                    fallback_count = await page.locator('.three-fallback').count()
                    assert canvas_count >= 1 or fallback_count >= 1, 'expected canvas or .three-fallback on Explore'
                    assert await page.locator('[data-location]').count() >= 1

                await page.screenshot(path=str(OUT / f'{label}-{view}.png'), full_page=True)

            await page.goto(BASE + '#/episode/ep6', wait_until='networkidle')
            await page.wait_for_selector('.reader-head h1')
            assert page.url.endswith('#/episode/ep6'), page.url
            await wait_for_focus(page, '.reader-head h1')
            assert await page.locator('.reader-head').count() == 1
            assert await page.locator('.reader-head').evaluate("el => getComputedStyle(el).backgroundImage !== 'none'")
            assert await page.locator('.continue-btn').count() == 1
            assert await page.locator('.secondary-btn.next-link').count() == 1

            # New: reflection ("Questions to consider") and summary
            # ("In summary") blocks render in the article body.
            await page.wait_for_selector('.reader-reflection')
            assert await page.locator('.reader-reflection h2').inner_text() == 'Questions to consider'
            assert await page.locator('.reader-reflection li').count() >= 1
            await page.wait_for_selector('.reader-summary')
            assert await page.locator('.reader-summary h2').inner_text() == 'In summary'
            assert await page.locator('.reader-summary li').count() >= 1

            await page.screenshot(path=str(OUT / f'{label}-episode-ep6.png'), full_page=True)

            await page.goto(BASE + '#/journey', wait_until='networkidle')
            await page.locator('[data-episode="ep6"]').click()
            await page.wait_for_selector('.reader-head h1')
            await page.locator('#readerBack').click()
            await page.wait_for_selector('#main h1')
            assert page.url.endswith('#/journey'), page.url

            # Library surfaces the derived People/Themes index pages as live
            # cards; the pages render entries (derived from episode content)
            # with chips linking back to episodes.
            await page.goto(BASE + '#/library', wait_until='networkidle')
            await page.wait_for_selector('#main h1')
            assert await page.locator('button.library-card').count() >= 2
            for route in ('people', 'themes'):
                await page.goto(BASE + f'#/{route}', wait_until='networkidle')
                await page.wait_for_selector('#main h1')
                await page.wait_for_selector('.index-item')
                assert await page.locator('.index-item').count() >= 1
                assert await page.locator('.ep-chip[data-episode]').count() >= 1

            # The Tapestry weaves connections from completed episodes; with a
            # couple completed it renders the loom (desktop) or warp (mobile)
            # with at least one woven thread.
            await page.evaluate("() => { localStorage.setItem('be-episode-ep3','done'); localStorage.setItem('be-episode-ep4','done'); }")
            await page.goto(BASE + '#/tapestry', wait_until='networkidle')
            await page.wait_for_selector('#main h1')
            if label == 'desktop':
                await page.wait_for_selector('.loom-svg')
                assert await page.locator('.loom-chord').count() >= 1
                assert await page.locator('.loom-thread').count() >= 1
            else:
                await page.wait_for_selector('.warp')
                assert await page.locator('.warp-row.done').count() >= 1
            await page.evaluate("() => { localStorage.removeItem('be-episode-ep3'); localStorage.removeItem('be-episode-ep4'); }")

            await page.goto(BASE + '#/', wait_until='networkidle')
            await page.locator('#searchBtn').click()
            await page.wait_for_selector('#searchInput')
            await page.locator('#searchInput').fill('covenant')
            # Episode bodies load asynchronously once the search overlay
            # opens, so wait for the result to actually appear rather than a
            # fixed timeout (which can flake under slow body loads).
            await page.wait_for_selector('[data-result="ep10"]', timeout=10000)
            assert await page.locator('[data-result="ep10"]').count() >= 1
            await page.locator('#searchInput').press('Tab')
            await page.locator('.close-search').press('Shift+Tab')
            await page.keyboard.press('Escape')
            assert await page.locator('.search-overlay').count() == 0

            before = await page.locator('#themeBtn').get_attribute('aria-label')
            await page.locator('#themeBtn').click()
            after = await page.locator('#themeBtn').get_attribute('aria-label')
            assert before != after

            await page.wait_for_timeout(500)
            if console_errors or page_errors:
                raise AssertionError(f'{label} console/page errors: {console_errors + page_errors}')

            await context.close()
        await browser.close()


if __name__ == '__main__':
    asyncio.run(main())
