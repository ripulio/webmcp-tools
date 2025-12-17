import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  test: {
    passWithNoTests: true,
		projects: [
			{
				extends: true,
				test: {
					include: ['./src/**/*.test.ts'],
          exclude: ['./src/**/*.browser.test.ts']
				}
			},
			{
				extends: true,
				test: {
					include: [
						'./src/**/*.browser.test.ts',
					],
          browser: {
            provider: playwright(),
            enabled: true,
            headless: true,
            screenshotFailures: false,
            instances: [
              { browser: 'chromium' },
            ]
          }
				}
			}
		]
  }
})
