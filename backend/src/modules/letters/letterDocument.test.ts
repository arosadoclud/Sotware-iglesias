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

it('preserves formal recipients without decorative titles or footer', () => {
  const html = renderLetterDocument({ content: 'Iglesia: Comunidad de prueba\nPastor/a/es: María\n\nQue la paz esté con ustedes.', title: 'Invitación', churchData: { nombre: 'Dios Fuerte' } });
  expect(html).toContain('Iglesia: <strong>Comunidad de prueba</strong>');
  expect(html).toContain('Pastor/a/es: <strong>María</strong>');
  expect(html).not.toContain('<footer>');
  expect(html).toContain('document-date');
  expect(html).not.toContain('CORRESPONDENCIA DE LA IGLESIA');
  expect(html).not.toContain('<h2>');
  expect(html).toContain('Times New Roman');
});
it('escapes event emphasis as text and keeps the requested date and signature order', () => {
  const html = renderLetterDocument({content:'Tema: <Encuentro> (fe + amor)',churchData:{nombre:'Dios Fuerte',fecha:'15 de agosto de 2026',pastor:'Mery',tituloPastor:'Pastora'},eventData:{tema:'<Encuentro> (fe + amor)'}});
  expect(html).toContain('<strong>&lt;Encuentro&gt; (fe + amor)</strong>');
  expect(html).toContain('15 de agosto de 2026');
  expect(html.indexOf('<p>Pastora</p>')).toBeLessThan(html.indexOf('<strong>Mery</strong>'));
  expect(html.match(/data:image\/png;base64,/g)).toHaveLength(2);
});
