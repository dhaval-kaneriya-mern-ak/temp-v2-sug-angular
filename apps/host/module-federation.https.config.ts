import { ModuleFederationConfig } from '@nx/module-federation';

const config: ModuleFederationConfig = {
  name: 'host',
  /**
   * HTTPS configuration for custom domains
   * Using tuple-syntax to define remote URLs with HTTPS and custom domains
   */
  remotes: [
    ['reports', 'https://reports.sug.rocks:4201'],
    ['messages', 'https://messages.sug.rocks:4202'],
  ],
};

/**
 * Nx requires a default export of the config to allow correct resolution of the module federation graph.
 **/
export default config;
