import fs from 'fs';
import path from 'path';
import { getProgramLogoDataUri } from './brand';

describe('Program brand logo', () => {
  it('embeds the same brand image used by the website without requiring network access', () => {
    const logo = getProgramLogoDataUri();
    expect(logo).toMatch(/^data:image\/png;base64,/);
    const embedded = Buffer.from(logo.split(',')[1], 'base64');
    const websiteLogo = fs.readFileSync(path.resolve(__dirname, '../../../frontend/public/arca-logo.png'));
    expect(embedded.equals(websiteLogo)).toBe(true);
  });
});
