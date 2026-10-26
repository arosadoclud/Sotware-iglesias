import { renderLetterDocument } from './letterDocument';
describe('Branded letter document', () => {
  it('embeds the bundled logo and escapes user content and header fields', () => {
    const html = renderLetterDocument({content:'Hola <script>alert(1)</script>\n\nPaz & amor',title:'Carta <ejemplo>',churchData:{nombre:'Iglesia & comunidad',pastor:'María <García>'}});
    expect(html).toContain('data:image/png;base64,');
    expect(html).toContain('Hola &lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script>');
    expect(html).toContain('Iglesia &amp; comunidad');
    expect(html).toContain('María &lt;García&gt;');
    expect(html).not.toContain('http://');
  });
  it('keeps the signature once and uses page-safe styles for long documents', () => {
    const html = renderLetterDocument({content:'Primer párrafo\n_____\nFirma antigua',churchData:{pastor:'Pastor de prueba'}});
    expect(html).not.toContain('Firma antigua');
    expect(html.match(/Pastor de prueba/g)).toHaveLength(1);
    expect(html).toContain('break-inside:avoid');
    expect(html).not.toContain('white-space: nowrap');
  });
});
