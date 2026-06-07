/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test, expect } from "@playwright/test";

test.describe("Keyword Sphere / AI fejlesztői tudásgömb E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Open the local development URL
    await page.goto("http://localhost:3000/");
  });

  test("should load the landing page successfully and render the knowledge sphere core components", async ({ page }) => {
    // 1. Verify page titles
    await expect(page.locator("h1")).toContainText("Keyword Sphere");
    
    // 2. Locate left sidebar controls
    await expect(page.locator("#left-control-sidebar")).toBeVisible();
    
    // 3. Locate group badge filters list
    await expect(page.locator("#group-filter-title")).toBeVisible();
    
    // 4. Locate right detail / explore guides panel
    await expect(page.locator("#explore-guide-panel")).toBeVisible();
    await expect(page.locator("#explore-guide-panel h2")).toContainText("Térbeli Felfedezés");

    // 5. Look for the Three.js stage
    await expect(page.locator("#three-stage")).toBeVisible();
  });

  test("should filter words correctly using the search bar input", async ({ page }) => {
    // 1. Locate and fill search inputs
    const searchInput = page.locator("#search-input");
    await expect(searchInput).toBeVisible();
    await searchInput.fill("jwt");

    // 2. Verify search index badge triggers
    const matchesBadge = page.locator("#search-matches-badge");
    await expect(matchesBadge).toBeVisible();
    await expect(matchesBadge).toContainText("Találati lista:");
  });

  test("should highlight and filter categories upon clicking a group badge filter item", async ({ page }) => {
    // 1. Locate vibe coding filter badge
    const filterBtn = page.locator("#filter-btn-vibe_coding");
    await expect(filterBtn).toBeVisible();
    
    // 2. Click category badge
    await filterBtn.click();

    // 3. Look for active filter resets
    const clearFilterBtn = page.locator("#clear-filter-btn");
    await expect(clearFilterBtn).toBeVisible();

    // 4. Reset filters
    await clearFilterBtn.click();
    await expect(clearFilterBtn).not.toBeVisible();
  });

  test("should change layouts from chaos to structured upon clicking any keyword node label", async ({ page }) => {
    // 1. Find a keyword label (e.g., jwt label or vibe_coding)
    const label = page.locator("div[id^='label-']").first();
    await expect(label).toBeVisible();
    
    // 2. Click it to select
    await label.click();

    // 3. Detailed board should appear and overwrite the introductory guide
    const detailRoot = page.locator("#detail-panel-root");
    await expect(detailRoot).toBeVisible();
    
    // 4. Verify detail content structure
    await expect(detailRoot).toContainText("Magyarázat / Fogalom");

    // 5. Accordion sections should be present
    const promptHeader = page.locator("#prompt-section-header");
    await expect(promptHeader).toBeVisible();

    // 6. Detailed pane close / reset triggers chaos mode back
    const closeBtn = page.locator("#close-detail-btn");
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();

    // 7. Guides should come back
    await expect(page.locator("#explore-guide-panel")).toBeVisible();
  });

  test("should allow clicking on a related keyword in detail view to slide selected focus directly", async ({ page }) => {
    // 1. Use the group filter to narrow down and click a node directly
    const filterBtn = page.locator("#filter-btn-authentication");
    await filterBtn.click();

    // 2. Identify the first visible auth node label
    const label = page.locator("div[id^='label-authentication.jwt']").first();
    await expect(label).toBeVisible();
    await label.click();

    // 3. Related connection links must be visible
    const relatedLinksSection = page.locator("#detail-panel-root");
    await expect(relatedLinksSection).toContainText("Kapcsolati Háló");

    // 4. Clean close
    const resetChaosBtn = page.locator("#reset-chaos-btn");
    await expect(resetChaosBtn).toBeVisible();
    await resetChaosBtn.click();
  });
});
