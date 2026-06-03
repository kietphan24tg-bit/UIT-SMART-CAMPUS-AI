import configFactory from './app.config';

describe('mobile app config', () => {
  it('uses the blank native splash image before the startup logo animation', () => {
    const config = configFactory();

    expect(config.splash?.image).toBe('./assets/brand/splash-blank.png');
  });
});
