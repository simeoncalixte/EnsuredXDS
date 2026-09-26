import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/react-vite'
import { mergeConfig } from 'vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-essentials', 'storybook-addon-remix-react-router'],
  framework: {
    name: '@storybook/react-vite',
    options: {}
  },
  async viteFinal(config) {
    return mergeConfig(config, {
      envDir: fileURLToPath(new URL('../../EnsuredAPI', import.meta.url)),
      optimizeDeps: {
        exclude: ['storybook-addon-remix-react-router'],
      },
    })
  },
}

export default config
