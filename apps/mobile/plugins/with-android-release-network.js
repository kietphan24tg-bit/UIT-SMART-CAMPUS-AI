const { mkdirSync, writeFileSync } = require('node:fs');
const path = require('node:path');

function loadConfigPlugins() {
  try {
    return require('expo/config-plugins');
  } catch {}

  try {
    return require('@expo/config-plugins');
  } catch {}

  return require(path.join(__dirname, '..', '..', '..', 'node_modules', '@expo', 'config-plugins'));
}

const { withAndroidManifest, withDangerousMod } = loadConfigPlugins();

const NETWORK_SECURITY_CONFIG = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="true" />
</network-security-config>
`;

function withAndroidReleaseNetwork(config) {
  config = withAndroidManifest(config, (mod) => {
    const application = mod.modResults.manifest.application?.[0];
    if (!application) {
      return mod;
    }

    application.$ = application.$ ?? {};
    application.$['android:usesCleartextTraffic'] = 'true';
    application.$['android:networkSecurityConfig'] = '@xml/network_security_config';

    return mod;
  });

  config = withDangerousMod(config, [
    'android',
    async (mod) => {
      const xmlDir = path.join(mod.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res', 'xml');
      mkdirSync(xmlDir, { recursive: true });
      writeFileSync(
        path.join(xmlDir, 'network_security_config.xml'),
        NETWORK_SECURITY_CONFIG,
        'utf8',
      );
      return mod;
    },
  ]);

  return config;
}

module.exports = withAndroidReleaseNetwork;
