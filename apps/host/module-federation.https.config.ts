import { ModuleFederationConfig } from '@nx/module-federation';

const config: ModuleFederationConfig = {
  name: 'host',
  /**
   * HTTPS configuration for custom domains
   * Using tuple-syntax to define remote URLs with HTTPS and custom domains
   */
  remotes: [
    // ['reports', 'https://reports.signupgenius.rocks:4201'],
    ['messages', 'https://messages.signupgenius.rocks:4202'],
    ['groups', 'https://groups.signupgenius.rocks:4203'],
  ],
};

/**
 * Nx requires a default export of the config to allow correct resolution of the module federation graph.
 **/
export default config;
