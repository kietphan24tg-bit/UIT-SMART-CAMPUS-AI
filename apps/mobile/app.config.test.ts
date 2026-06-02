describe('mobile app config', () => {
  it('uses the UIT 20-year startup logo for the native splash image', () => {
    jest.resetModules();
    const configFactory = require('./app.config').default as () => {
      splash?: { image?: string };
    };

    const config = configFactory();

    expect(config.splash?.image).toBe('./assets/brand/startup-logo.png');
  });
});
