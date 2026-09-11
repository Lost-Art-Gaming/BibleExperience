from pathlib import Path
import asyncio
from playwright.async_api import async_playwright

BASE = "http://127.0.0.1:4173/BibleExperience/"
OUT = Path("verification")
OUT.mkdir(exist_ok=True)


async def wait_for_focus(page, selector):
    await page.wait_for_selector(selector)
    await page.locator(selector).scroll_into_view_if_needed()


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        for label, viewport in (("desktop", {"width": 1440, "height": 1000}), ("mobile", {"width": 390, "height": 844})):
            context = await browser.new_context(viewport=viewport, device_scale_factor=1)
            page = await context.new_page()
            console_errors = []
            page_errors = []
            page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
            page.on("pageerror", lambda err: page_errors.append(str(err)))

            # All route assertions below wait for the route's meaningful DOM
            # state. Do not require networkidle: the Eden reference is a
            # self-contained animated iframe and external resources may keep
            # Chromium's network-idle heuristic open indefinitely.
            await page.goto(BASE + "#/", wait_until="domcontentloaded")
            await page.wait_for_selector("#main")
            await page.wait_for_timeout(300)

            for view in ("journey", "explore"):
                await page.goto(BASE + f"#/{view}", wait_until="domcontentloaded")
                await page.wait_for_selector("#main h1")
                if label == "desktop":
                    assert await page.locator(".desktop-nav").evaluate("el => getComputedStyle(el).display !== 'none'")
                    assert await page.locator(".bottom-nav").evaluate("el => getComputedStyle(el).display === 'none'")
                else:
                    assert await page.locator(".bottom-nav").evaluate("el => getComputedStyle(el).display !== 'none'")

                if view == "explore":
                    assert await page.locator(".collection-grid").count() == 1
                    assert await page.locator("[data-artifact]").count() >= 1
                    assert await page.locator(".collection-meter").count() == 1

                await page.screenshot(path=str(OUT / f"{label}-{view}.png"), full_page=True)

            await page.evaluate("() => localStorage.setItem('be-episode-ep1', 'done')")
            await page.goto(BASE + "#/", wait_until="domcontentloaded")
            await page.wait_for_selector(".hero-mark")
            assert await page.locator(".hero-mark").inner_text() == "02/10"
            await page.evaluate("() => localStorage.removeItem('be-episode-ep1')")

            await page.goto(BASE + "#/episode/ep1", wait_until="domcontentloaded")
            await page.wait_for_selector(".reader-head h1")
            assert page.url.endswith("#/episode/ep1"), page.url
            await wait_for_focus(page, ".reader-head h1")
            assert await page.locator(".reader-head").count() == 1
            assert await page.locator(".reader-head").evaluate("el => getComputedStyle(el).backgroundImage !== 'none'")
            assert await page.locator(".continue-btn").count() == 1
            assert await page.locator(".secondary-btn.next-link").count() == 1
            await page.wait_for_selector(".reader-reflection")
            assert await page.locator(".reader-reflection h2").inner_text() == "Questions to consider"
            assert await page.locator(".reader-reflection li").count() >= 1
            await page.wait_for_selector(".reader-summary")
            assert await page.locator(".reader-summary h2").inner_text() == "In summary"
            assert await page.locator(".reader-summary li").count() >= 1
            assert await page.locator(".ref-link[role=\"link\"]").count() >= 1
            assert await page.locator(".reader-note .note-field").count() == 1
            await page.screenshot(path=str(OUT / f"{label}-episode-ep1.png"), full_page=True)

            await page.goto(BASE + "#/episode/ep5", wait_until="domcontentloaded")
            await page.wait_for_selector("#main h1")
            assert await page.locator(".reader-sealed").count() == 1
            assert await page.locator(".reader-head").count() == 0

            await page.goto(BASE + "#/journey", wait_until="domcontentloaded")
            await page.wait_for_selector("#main h1")
            assert await page.locator(".episode-card.locked").count() >= 1
            await page.locator('[data-episode="ep1"]').click()
            await page.wait_for_selector(".reader-head h1")
            await page.locator("#readerBack").click()
            await page.wait_for_selector("#main h1")
            assert page.url.endswith("#/journey"), page.url

            await page.goto(BASE + "#/library", wait_until="domcontentloaded")
            await page.wait_for_selector("#main h1")
            assert await page.locator("button.library-card").count() >= 3
            for route in ("people", "themes", "insights"):
                await page.goto(BASE + f"#/{route}", wait_until="domcontentloaded")
                await page.wait_for_selector("#main h1")
            await page.goto(BASE + "#/insights", wait_until="domcontentloaded")
            await page.wait_for_selector("#insightsInput")
            await page.locator("#insightsInput").fill("Genesis 3:15")
            await page.wait_for_selector(".index-insight")
            assert await page.locator(".index-insight").count() >= 1
            assert await page.locator(".index-insight .cite-link").count() >= 1

            await page.evaluate("() => { for (const i of [1,2,3]) localStorage.setItem('be-episode-ep'+i,'done'); }")
            await page.goto(BASE + "#/tapestry", wait_until="domcontentloaded")
            await page.wait_for_selector("#main h1")
            if label == "desktop":
                await page.wait_for_selector(".loom-svg")
                assert await page.locator(".loom-chord").count() >= 1
                assert await page.locator(".loom-thread").count() >= 1
            else:
                await page.wait_for_selector(".warp")
                assert await page.locator(".warp-row.done").count() >= 1
            await page.evaluate("() => { for (const i of [1,2,3]) localStorage.removeItem('be-episode-ep'+i); }")

            await page.evaluate("() => { for (const i of [1,2]) localStorage.setItem('be-episode-ep'+i,'done'); }")
            await page.goto(BASE + "#/explore", wait_until="domcontentloaded")
            await page.wait_for_selector(".diorama")
            assert await page.locator(".collection-count").inner_text() == "1"
            assert await page.locator('[data-artifact="eden"].artifact-card.sealed').count() == 0
            assert await page.locator('[data-artifact="ark"].artifact-card.sealed').count() == 1
            assert await page.locator(".diorama-plate h3").inner_text() == "Eden"
            assert await page.locator(".diorama-legend li").count() >= 3
            canvas_count = await page.locator(".diorama-stage canvas").count()
            fallback_count = await page.locator(".diorama-fallback").count()
            assert canvas_count >= 1 or fallback_count >= 1, "expected canvas or .diorama-fallback on the stage"
            await page.evaluate("() => window.scrollTo(0, document.body.scrollHeight)")
            await page.wait_for_timeout(700)
            assert await page.locator(".artifact-card").count() == 4
            await page.screenshot(path=str(OUT / f"{label}-collection.png"), full_page=True)

            await page.goto(BASE + "#/episode/ep2", wait_until="domcontentloaded")
            await page.wait_for_selector(".reader-model .diorama")
            assert await page.locator(".reader-model .diorama-plate h3").inner_text() == "Eden"
            await page.wait_for_timeout(700)
            await page.screenshot(path=str(OUT / f"{label}-episode-ep2-model.png"), full_page=True)
            await page.evaluate("() => { for (const i of [1,2]) localStorage.removeItem('be-episode-ep'+i); }")

            await page.goto(BASE + "#/", wait_until="domcontentloaded")
            await page.locator("#searchBtn").click()
            await page.wait_for_selector("#searchInput")
            await page.locator("#searchInput").fill("covenant")
            await page.wait_for_selector('[data-result="ep10"]', timeout=10000)
            assert await page.locator('[data-result="ep10"]').count() >= 1
            await page.locator("#searchInput").press("Tab")
            await page.locator(".close-search").press("Shift+Tab")
            await page.keyboard.press("Escape")
            assert await page.locator(".search-overlay").count() == 0

            before = await page.locator("#themeBtn").get_attribute("aria-label")
            await page.locator("#themeBtn").click()
            after = await page.locator("#themeBtn").get_attribute("aria-label")
            assert before != after

            await page.wait_for_timeout(500)
            if console_errors or page_errors:
                raise AssertionError(f"{label} console/page errors: {console_errors + page_errors}")

            await context.close()
        await browser.close()


if __name__ == "__main__":
    asyncio.run(main())
