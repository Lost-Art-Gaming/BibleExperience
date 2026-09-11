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
                    # The Collection lists every artifact, sealed or not —
                    # the grid is always present, so it is safe to assert on.
                    assert await page.locator('.collection-grid').count() == 1
                    assert await page.locator('[data-artifact]').count() >= 1
                    # With nothing completed the meter reads 0 and the empty
                    # state stands in for the stage. The diorama itself is
                    # only asserted once an episode has been completed
                    # (see the collection check further down).
                    assert await page.locator('.collection-meter').count() == 1

                await page.screenshot(path=str(OUT / f'{label}-{view}.png'), full_page=True)

            # Reader content is tested on ep1 — always unlocked under the
            # progression gating (later episodes are sealed until reached).
            await page.goto(BASE + '#/episode/ep1', wait_until='networkidle')
            await page.wait_for_selector('.reader-head h1')
            assert page.url.endswith('#/episode/ep1'), page.url
            await wait_for_focus(page, '.reader-head h1')
            assert await page.locator('.reader-head').count() == 1
            assert await page.locator('.reader-head').evaluate("el => getComputedStyle(el).backgroundImage !== 'none'")
            assert await page.locator('.continue-btn').count() == 1
            assert await page.locator('.secondary-btn.next-link').count() == 1

            # Reflection ("Questions to consider") and summary ("In summary")
            # blocks render in the article body.
            await page.wait_for_selector('.reader-reflection')
            assert await page.locator('.reader-reflection h2').inner_text() == 'Questions to consider'
            assert await page.locator('.reader-reflection li').count() >= 1
            await page.wait_for_selector('.reader-summary')
            assert await page.locator('.reader-summary h2').inner_text() == 'In summary'
            assert await page.locator('.reader-summary li').count() >= 1

            # Verse refs are real links to the NWT reader; the personal-layer
            # note field is present.
            assert await page.locator('.ref-link[role="link"]').count() >= 1
            assert await page.locator('.reader-note .note-field').count() == 1

            await page.screenshot(path=str(OUT / f'{label}-episode-ep1.png'), full_page=True)

            # Progression gating: a sealed episode reached by deep link shows
            # the sealed state, never the content.
            await page.goto(BASE + '#/episode/ep5', wait_until='networkidle')
            await page.wait_for_selector('#main h1')
            assert await page.locator('.reader-sealed').count() == 1
            assert await page.locator('.reader-head').count() == 0

            # Journey shows the current episode plus a single sealed teaser;
            # the current card navigates, the locked one is not clickable.
            await page.goto(BASE + '#/journey', wait_until='networkidle')
            await page.wait_for_selector('#main h1')
            assert await page.locator('.episode-card.locked').count() >= 1
            await page.locator('[data-episode="ep1"]').click()
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
            # Complete a contiguous run so those episodes are unlocked and
            # weave together (a gap wouldn't unlock the later ones).
            await page.evaluate("() => { for (const i of [1,2,3]) localStorage.setItem('be-episode-ep'+i,'done'); }")
            await page.goto(BASE + '#/tapestry', wait_until='networkidle')
            await page.wait_for_selector('#main h1')
            if label == 'desktop':
                await page.wait_for_selector('.loom-svg')
                assert await page.locator('.loom-chord').count() >= 1
                assert await page.locator('.loom-thread').count() >= 1
            else:
                await page.wait_for_selector('.warp')
                assert await page.locator('.warp-row.done').count() >= 1
            await page.evaluate("() => { for (const i of [1,2,3]) localStorage.removeItem('be-episode-ep'+i); }")

            # The Collection: completing ep2 uncovers Eden, which then puts a
            # diorama on the stage. Headless Chromium may not expose WebGL,
            # so the stage legitimately renders either the <canvas> or the
            # static `.diorama-fallback` — accept either, but the chrome
            # (plate, legend) must be there in both cases.
            await page.evaluate("() => { for (const i of [1,2]) localStorage.setItem('be-episode-ep'+i,'done'); }")
            await page.goto(BASE + '#/explore', wait_until='networkidle')
            await page.wait_for_selector('.diorama')
            assert await page.locator('.collection-count').inner_text() == '1'
            assert await page.locator('[data-artifact="eden"].artifact-card.sealed').count() == 0
            assert await page.locator('[data-artifact="ark"].artifact-card.sealed').count() == 1
            assert await page.locator('.diorama-plate h3').inner_text() == 'Eden'
            assert await page.locator('.diorama-legend li').count() >= 3
            canvas_count = await page.locator('.diorama-stage canvas').count()
            fallback_count = await page.locator('.diorama-fallback').count()
            assert canvas_count >= 1 or fallback_count >= 1, 'expected canvas or .diorama-fallback on the stage'
            # Scroll the grid into view so its reveal-on-scroll cards are
            # actually painted in the full-page screenshot.
            await page.evaluate("() => window.scrollTo(0, document.body.scrollHeight)")
            await page.wait_for_timeout(700)  # let the route/reveal transition settle
            assert await page.locator('.artifact-card').count() == 4
            await page.screenshot(path=str(OUT / f'{label}-collection.png'), full_page=True)

            # The same model appears inside the episode that tells its story.
            await page.goto(BASE + '#/episode/ep2', wait_until='networkidle')
            await page.wait_for_selector('.reader-model .diorama')
            assert await page.locator('.reader-model .diorama-plate h3').inner_text() == 'Eden'
            await page.wait_for_timeout(700)
            await page.screenshot(path=str(OUT / f'{label}-episode-ep2-model.png'), full_page=True)
            await page.evaluate("() => { for (const i of [1,2]) localStorage.removeItem('be-episode-ep'+i); }")

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
