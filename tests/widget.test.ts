import { test, expect } from "@playwright/test";

test.describe("Widget tests", () => {
  test("Send message from widget to panel and from panel to widget", async ({ page, context }) => {
    
    // Step 1: Login to project
    await test.step("Login to project", async () => {
      await page.goto(`https://www.tidio.com/panel/?project_public_key=${process.env.PROJECT_PUBLIC_KEY}&api_token=${process.env.API_TOKEN}`);
    });

    // Step 2: Simulate visitor and send message
    await test.step("Simulate visitor and send message from widget to panel", async () => {
      // Open inbox section and simulate visitor
      await page.locator('[data-test-id="inbox-section-button"]').click();
      const [popup] = await Promise.all([
        context.waitForEvent('page'),
        page.getByRole('button', { name: 'Simulate a conversation' }).click(),
      ]);
      await popup.waitForLoadState('domcontentloaded');
      await expect(popup).toHaveURL(/simulateVisitor/);

      // Interact with the widget to send a message
      await popup.locator('[data-testid="flyNewMessageButton"]').click();
      const messageTextarea = popup.locator('[data-testid="newMessageTextarea"]');
      await messageTextarea.fill('Test message.');
      await messageTextarea.press('Enter');

      // Fill in email and submit
      await popup.locator('input[type="email"]').fill('test@example.com');
      await popup.locator('button[type="submit"]').click();

      // Confirm message was sent from visitor
      const visitorMessage = popup.locator('div.message.message-visitor >> span.message-content');
      await expect(visitorMessage).toHaveText('Test message.');

      // Step 3: Verify message appears in Unassigned section in panel
      const container = page.locator('#inbox-live-conversations-folders');
      const unassignedButton = container.locator('button.nav-item', {
        has: page.locator('p', { hasText: 'Unassigned' })
      });
      await unassignedButton.click();

      const messageList = page.locator('div[data-testid="virtuoso-item-list"]');
      const incomingMessage = messageList.locator('a:has(p:has-text("Test message."))');
      await expect(incomingMessage).toBeVisible();
      await incomingMessage.click();
    });

    // Step 4: Reply from the panel
    await test.step("Send a reply message from the panel", async () => {
      const joinButton = page.getByRole('button', { name: 'Join conversation' });
      if (await joinButton.isVisible()) {
        await joinButton.click();
      }

      const replyInput = page.locator('[data-testid="rich-text-editor"]');
      await expect(replyInput).toBeVisible();
      await replyInput.press('Enter');
      await replyInput.fill('Reply test.');
      await replyInput.press('Enter');
    });
  });
});
