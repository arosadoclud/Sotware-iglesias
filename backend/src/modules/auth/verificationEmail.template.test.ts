import { verificationEmail } from './verificationEmail.template';
describe('Church verification email', () => {
  it('escapes names and links in HTML and includes a plain text alternative', () => {
    const result = verificationEmail('<script>Andy</script>', 'https://iglesia.test/verify?a=1&b=2', 'https://iglesia.test/');
    expect(result.html).not.toContain('<script>Andy');
    expect(result.html).toContain('&lt;script&gt;Andy');
    expect(result.html).toContain('a=1&amp;b=2');
    expect(result.html).toContain('https://iglesia.test/arca-logo.png');
    expect(result.text).toContain('https://iglesia.test/verify?a=1&b=2');
    expect(result.text).toContain('72 horas');
    expect(result.html).toContain('72 horas');
    expect(result.subject).toContain('Arca Evangélica');
  });
});
