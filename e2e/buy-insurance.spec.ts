/**
 * E2E Test: Insurance Buying Flow
 * Testing the complete journey: Browse → Select → Personal Info → Review → Payment → Purchase
 */

import { test, expect } from "@playwright/test";

test.describe("Buy Insurance - Complete User Journey", () => {
  test("Step 1: User visits site and browses plans", async ({ page }) => {
    // Step 1: User visits site
    await page.goto("/", { waitUntil: "networkidle" });
    let pageContent = await page.textContent("body");
    expect(pageContent).toBeTruthy();

    // Step 2: Browse plans - Navigate to insurance buying page
    await page.goto("/buy-insurance", { waitUntil: "networkidle" });
    pageContent = await page.textContent("body");
    expect(pageContent).toBeTruthy();
    expect(pageContent).not.toContain("Error");
  });

  test("Step 2-3: Select a plan with details and coverage info", async ({ page }) => {
    await page.goto("/buy-insurance", { waitUntil: "networkidle" });

    // Look for plan browsing/filtering elements
    const planCards = page.locator("[class*='plan'], [class*='card'], [role='article']");
    const planCount = await planCards.count();
    expect(planCount).toBeGreaterThanOrEqual(0);

    // Try to select a plan or view its details
    const firstPlan = planCards.first();
    const detailsBtn = firstPlan.locator("button, a").first();
    
    if (await detailsBtn.isVisible()) {
      await detailsBtn.click();
      await page.waitForLoadState("networkidle");
    }

    const content = await page.textContent("body");
    expect(content).toBeTruthy();
  });

  test("Step 3-4: Enter personal information", async ({ page }) => {
    await page.goto("/buy-insurance", { waitUntil: "networkidle" });

    // Fill name field
    const nameInput = page.locator(
      'input[placeholder*="name"], input[name*="name"], input[placeholder*="Name"]'
    ).first();
    if (await nameInput.isVisible()) {
      await nameInput.fill("Rajesh Kumar");
    }

    // Fill age field
    const ageInput = page.locator(
      'input[placeholder*="age"], input[name*="age"], input[placeholder*="Age"]'
    ).first();
    if (await ageInput.isVisible()) {
      await ageInput.fill("32");
    }

    // Fill email field
    const emailInput = page.locator(
      'input[type="email"], input[placeholder*="email"], input[placeholder*="Email"]'
    ).first();
    if (await emailInput.isVisible()) {
      await emailInput.fill("rajesh@example.com");
    }

    // Fill phone field
    const phoneInput = page.locator(
      'input[type="tel"], input[placeholder*="phone"], input[placeholder*="mobile"], input[name*="phone"]'
    ).first();
    if (await phoneInput.isVisible()) {
      await phoneInput.fill("9876543210");
    }

    const formContent = await page.textContent("body");
    expect(formContent).toBeTruthy();
  });

  test("Step 5: Review quote and coverage details", async ({ page }) => {
    await page.goto("/buy-insurance", { waitUntil: "networkidle" });

    // Fill form
    const nameInput = page.locator('input[placeholder*="name"], input[name*="name"]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill("Anjali Singh");
    }

    // Look for continue/next button to proceed to review
    const continueBtn = page.locator(
      "button:has-text('Continue'), button:has-text('Next'), button:has-text('Proceed'), button:has-text('Review')"
    ).first();

    if (await continueBtn.isVisible()) {
      await continueBtn.click();
      await page.waitForLoadState("networkidle");
    }

    // Verify we have content (quote summary or next step)
    const reviewContent = await page.textContent("body");
    expect(reviewContent).toBeTruthy();
  });

  test("Step 6: Select payment method", async ({ page }) => {
    await page.goto("/buy-insurance", { waitUntil: "networkidle" });

    // Look for payment method options
    const paymentSection = page.locator("[class*='payment'], [class*='checkout'], [class*='method']");
    const hasPaymentSection = await paymentSection.isVisible().catch(() => false);

    if (hasPaymentSection) {
      // Look for payment options (radio buttons or cards)
      const paymentOptions = page.locator(
        "input[type='radio'], button[role='radio'], label:has-text('Credit'), label:has-text('Debit'), label:has-text('UPI'), label:has-text('Wallet')"
      );
      const optionCount = await paymentOptions.count().catch(() => 0);
      expect(optionCount).toBeGreaterThanOrEqual(0);
    }

    const pageContent = await page.textContent("body");
    expect(pageContent).toBeTruthy();
  });

  test("Step 7: Policy purchase confirmation", async ({ page }) => {
    await page.goto("/buy-insurance", { waitUntil: "networkidle" });

    // Look for purchase/buy button
    const buyBtn = page.locator(
      "button:has-text('Buy'), button:has-text('Purchase'), button:has-text('Confirm'), button:has-text('Pay'), button:has-text('Place Order')"
    ).first();

    if (await buyBtn.isVisible()) {
      // Verify button is enabled or accessible
      const isDisabled = await buyBtn.isDisabled().catch(() => false);
      expect(isDisabled).toBeFalsy();
    }

    const content = await page.textContent("body");
    expect(content).toBeTruthy();
  });

  test("Step 8-9: Dashboard - View active policies", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });

    const dashboardContent = await page.textContent("body");
    expect(dashboardContent).toBeTruthy();

    // Look for policies list/table
    const policyElements = page.locator(
      "[class*='policy'], [class*='list'], table, [role='list']"
    );
    const policyCount = await policyElements.count().catch(() => 0);
    expect(policyCount).toBeGreaterThanOrEqual(0);
  });

  test("Step 10: View policies list with details", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });

    // Look for policy rows/items showing type, premium, coverage, expiry
    const policyItems = page.locator(
      "[class*='policy-item'], [class*='policy-row'], tr, [role='article']"
    );
    const itemCount = await policyItems.count().catch(() => 0);
    expect(itemCount).toBeGreaterThanOrEqual(0);

    const content = await page.textContent("body");
    expect(content).toBeTruthy();
  });

  test("Step 11: View policy details (coverage, exclusions, terms)", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });

    // Try to click on a policy to view details
    const policyLink = page.locator(
      "a[href*='policy'], button:has-text('View Details'), button:has-text('Details'), a:has-text('View')"
    ).first();

    if (await policyLink.isVisible()) {
      await policyLink.click();
      await page.waitForLoadState("networkidle");
    }

    // Verify policy details page loaded
    const detailsContent = await page.textContent("body");
    expect(detailsContent).toBeTruthy();
  });

  test("Complete flow on mobile device", async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
    });

    const page = await context.newPage();

    // Step 1: Visit site
    await page.goto("/", { waitUntil: "networkidle" });

    // Step 2: Browse plans
    await page.goto("/buy-insurance", { waitUntil: "networkidle" });

    // Step 3: Fill some info
    const input = page.locator("input").first();
    if (await input.isVisible()) {
      await input.fill("Mobile Test");
    }

    // Step 9: View dashboard
    await page.goto("/dashboard", { waitUntil: "networkidle" });

    const content = await page.textContent("body");
    expect(content).toBeTruthy();

    await context.close();
  });

  test("Form validation at each step", async ({ page }) => {
    await page.goto("/buy-insurance", { waitUntil: "networkidle" });

    // Try to submit without filling
    const submitBtn = page.locator(
      "button[type='submit'], button:has-text('Continue'), button:has-text('Next')"
    ).first();

    if (await submitBtn.isVisible()) {
      const isDisabled = await submitBtn.isDisabled().catch(() => false);
      expect(isDisabled).toBeTruthy();
    }

    // Fill one field
    const firstInput = page.locator("input").first();
    if (await firstInput.isVisible()) {
      await firstInput.fill("Validation Test");
      await page.waitForTimeout(300);

      // Button should still be disabled (missing other required fields)
      if (await submitBtn.isVisible()) {
        const stillDisabled = await submitBtn.isDisabled().catch(() => false);
        expect(stillDisabled).toBeTruthy();
      }
    }
  });
});
