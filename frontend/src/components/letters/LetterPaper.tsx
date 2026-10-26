import { BrandLogo } from '../layout/BrandLogo'
import './letters.css'
export function LetterPaper({
  content,
  churchName = 'Arca Evangélica · Dios Fuerte',
  address,
  phone,
  pastor,
  pastorTitle,
  title
}: {
  content: string
  churchName?: string
  address?: string
  phone?: string
  pastor?: string
  pastorTitle?: string
  title?: string
}) {
  const body = content.split(/\n_{5,}/)[0]
  return (
    <article className="letter-paper">
      <header>
        <BrandLogo />
        <div>
          <span>CORRESPONDENCIA DE LA IGLESIA</span>
          <h2>{churchName || 'Arca Evangélica · Dios Fuerte'}</h2>
          {address && <p>{address}</p>}
          {phone && <p>{phone}</p>}
        </div>
      </header>
      {title && <h3 className="letter-paper-title">{title}</h3>}
      <div className="letter-paper-body">
        {body
          .split('\n')
          .map((line, i) =>
            line.trim() ? (
              <p key={i}>{line}</p>
            ) : (
              <div className="letter-paragraph-gap" key={i} />
            )
          )}
      </div>
      {pastor && (
        <div className="letter-paper-signature">
          <span />
          <strong>{pastor}</strong>
          <p>{pastorTitle}</p>
        </div>
      )}
      <footer>
        ARCA EVANGÉLICA · DIOS FUERTE <span>Fe, comunidad y propósito</span>
      </footer>
    </article>
  )
}
