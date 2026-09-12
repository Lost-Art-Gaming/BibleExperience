import asyncio
import os
from pathlib import Path
from playwright.async_api import async_playwright

BASE = 'http://localhost:4173/BibleExperience/'
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'verification'
OUT.mkdir(exist_ok=True)

VIEWS = ['home', 'journey', 'timeline', 'explore', 'library']
SIZES = [(390, 844, 'mobile'), (1440, 900, 'desktop')]

LAUNCH_KWARGS = {'headless': True, 'args': ['--no-sandbox']}
if os.environ.get('PLAYWRIGHT_CHROMIUM_PATH'):
    LAUNCH_KWARGS['executable_path'] = os.environ['PLAYWRIGHT_CHROMIUM_PATH']


async def wait_for_focus(page, selector, timeout=5000):
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

            # Home's hero position tracks the next experience rather than
            # remaining hard-coded at 01/10.
            await page.evaluate("() => localStorage.setItem('be-episode-ep1', 'done')")
            await page.goto(BASE + '#/', wait_until='networkidle')
            assert await page.locator('.hero-mark').inner_text() == '02/10'
            await page.evaluate("() => localStorage.removeItem('be-episode-ep1')")

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
            await page.wait_for_selector('.reader-reflection')
            assert await page.locator('.reader-reflection h2').inner_text() == 'Questions to consider'
            assert await page.locator('.reader-reflection li').count() >= 1
            await page.wait_for_selector('.reader-summary')
            assert await page.locator('.reader-summary h2').inner_text() == 'In summary'
            assert await page.locator('.reader-summary li').count() >= 1
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

            # Library surfaces People, Themes and the now-live Verse Insights
            # study surface.
            await page.goto(BASE + '#/library', wait_until='networkidle')
            await page.wait_for_selector('#main h1')
            assert await page.locator('button.library-card').count() >= 3
            for route in ('people', 'themes', 'insights'):
                await page.goto(BASE + f'#/{route}', wait_until='networkidle')
                await page.wait_for_selector('#main h1')
            await page.goto(BASE + '#/insights', wait_until='networkidle')
            await page.wait_for_selector('#insightsInput')
            await page.locator('#insightsInput').fill('Genesis 3:15')
            await page.wait_for_selector('.index-insight')
            assert await page.locator('.index-insight').count() >= 1
            assert await page.locator('.index-insight .cite-link').count() >= 1

            # The Tapestry weaves connections from completed episodes; with a
            # couple completed it renders the loom (desktop) or warp (mobile)
            # with at least one woven thread.
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
            # Eden is the supplied reference scene, hosted in a same-origin
            # iframe that keeps loading and animating — `networkidle` never
            # settles on a route that shows it, so wait on the DOM instead.
            await page.evaluate("() => { for (const i of [1,2]) localStorage.setItem('be-episode-ep'+i,'done'); }")
            await page.goto(BASE + '#/explore', wait_until='domcontentloaded')
            await page.wait_for_selector('.diorama')
            assert await page.locator('.collection-count').inner_text() == '1'
            assert await page.locator('[data-artifact="eden"].artifact-card.sealed').count() == 0
            assert await page.locator('[data-artifact="ark"].artifact-card.sealed').count() == 1
            # Eden carries the reference document's own plate, not the host's.
            assert await page.locator('.diorama-stage iframe').count() == 1, 'Eden renders the reference document'
            eden = page.frame_locator('.diorama-stage iframe')
            await eden.locator('.plate h1').wait_for()
            assert await eden.locator('.plate h1').inner_text() == 'The Garden of Eden'
            assert await eden.locator('#legend li').count() >= 3
            # Scroll the grid into view so its reveal-on-scroll cards are
            # actually painted in the full-page screenshot.
            await page.evaluate("() => window.scrollTo(0, document.body.scrollHeight)")
            await page.wait_for_timeout(700)  # let the route/reveal transition settle
            assert await page.locator('.artifact-card').count() == 4
            await page.screenshot(path=str(OUT / f'{label}-collection.png'), full_page=True)

            # The models built on the app's own diorama stage carry the host
            # chrome: a legend of their parts and the controls to turn them.
            # Ark is the one with a cutaway, so it exercises all three.
            # Re-enter the route so the new completion is read: the app is
            # already on #/explore, and a goto to the identical hash URL is a
            # same-document navigation that would not re-render.
            await page.evaluate("() => localStorage.setItem('be-episode-ep6','done')")
            await page.reload(wait_until='domcontentloaded')
            await page.wait_for_selector('[data-artifact="ark"].artifact-card:not(.sealed)')
            await page.locator('[data-artifact="ark"].artifact-card').click()
            await page.wait_for_selector('.diorama[data-artifact="ark"]')
            assert await page.locator('.diorama-plate h3').inner_text() == 'The Ark'
            assert await page.locator('.diorama-legend li').count() >= 3
            canvas_count = await page.locator('.diorama-stage canvas').count()
            fallback_count = await page.locator('.diorama-fallback').count()
            assert canvas_count >= 1 or fallback_count >= 1, 'expected canvas or .diorama-fallback on the stage'
            if canvas_count:
                assert await page.locator('.diorama-controls button').count() == 3
            await page.evaluate("() => localStorage.removeItem('be-episode-ep6')")

            # The same model appears inside the episode that tells its story.
            await page.goto(BASE + '#/episode/ep2', wait_until='domcontentloaded')
            await page.wait_for_selector('.reader-model .diorama')
            reader_eden = page.frame_locator('.reader-model .diorama-stage iframe')
            await reader_eden.locator('.plate h1').wait_for()
            assert await reader_eden.locator('.plate h1').inner_text() == 'The Garden of Eden'
            await page.wait_for_timeout(700)
            await page.screenshot(path=str(OUT / f'{label}-episode-ep2-model.png'), full_page=True)
            await page.evaluate("() => { for (const i of [1,2]) localStorage.removeItem('be-episode-ep'+i); }")

            await page.goto(BASE + '#/', wait_until='networkidle')
            await page.locator('#searchBtn').click()
            await page.wait_for_selector('#searchInput')
            await page.locator('#searchInput').fill('covenant')
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
