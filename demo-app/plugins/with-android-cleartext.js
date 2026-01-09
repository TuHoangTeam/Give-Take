const { withAndroidManifest, withDangerousMod, AndroidConfig } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const NETWORK_CONFIG_NAME = 'network_security_config.xml';

const setCleartextFlags = (androidManifest) => {
  const app = AndroidConfig.Manifest.getMainApplicationOrThrow(androidManifest);
  app.$['android:usesCleartextTraffic'] = 'true';
  app.$['android:networkSecurityConfig'] = '@xml/network_security_config';
  return androidManifest;
};

const writeNetworkSecurityConfig = (projectRoot) => {
  const xmlDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res', 'xml');
  fs.mkdirSync(xmlDir, { recursive: true });
  const filePath = path.join(xmlDir, NETWORK_CONFIG_NAME);
  const contents = `<?xml version="1.0" encoding="utf-8"?>\n` +
    `<network-security-config>\n` +
    `  <base-config cleartextTrafficPermitted="true">\n` +
    `    <trust-anchors>\n` +
    `      <certificates src="system" />\n` +
    `    </trust-anchors>\n` +
    `  </base-config>\n` +
    `</network-security-config>\n`;
  fs.writeFileSync(filePath, contents);
};

const withAndroidCleartext = (config) => {
  config = withAndroidManifest(config, async (config) => {
    config.modResults = setCleartextFlags(config.modResults);
    return config;
  });

  config = withDangerousMod(config, ['android', async (config) => {
    writeNetworkSecurityConfig(config.modRequest.projectRoot);
    return config;
  }]);

  return config;
};

module.exports = withAndroidCleartext;
