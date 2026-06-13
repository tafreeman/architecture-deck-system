/** @type {import('@storybook/react-vite').StorybookConfig} */
const config = {
  stories: [
    "../src/**/*.stories.@(js|jsx)",
  ],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    // addon-onboarding removed: it injects an interactive first-run prompt that
    // hangs CI runners waiting for stdin that never arrives.
  ],
  framework: "@storybook/react-vite",
  core: {
    // Disable telemetry to prevent outbound HTTP calls that can hang or
    // significantly slow down CI builds on restricted/throttled networks.
    disableTelemetry: true,
  },
};

export default config;
