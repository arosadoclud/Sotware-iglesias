import fs from 'fs';
import path from 'path';

let programLogo: string | undefined;

/** Bundled branding also works in PDFs without network access or database changes. */
export function getProgramLogoDataUri(): string {
  if (!programLogo) {
    const image = fs.readFileSync(path.resolve(__dirname, '../../public/arca-logo.png'));
    programLogo = `data:image/png;base64,${image.toString('base64')}`;
  }
  return programLogo;
}
