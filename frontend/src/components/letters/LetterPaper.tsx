import { BrandLogo } from '../layout/BrandLogo'
import './letters.css'
export function LetterPaper({
  content,
  churchName = 'Iglesia Evangélica Dios Fuerte',
  address,
  phone,
  pastor,
  pastorTitle,
  date,
  emphasis = []
}: {
  content: string
  churchName?: string
  address?: string
  phone?: string
  pastor?: string
  pastorTitle?: string
  title?: string
  date?: string
  emphasis?: string[]
}) {
  const lines = content
    .split(/\n_{5,}/)[0]
    .trim()
    .split('\n')
  const embeddedDate = /^\d{1,2} de [a-záéíóúñ]+ de \d{4}$/i.test(
    lines[0]?.trim() || ''
  )
    ? lines.shift()!.trim()
    : ''
  while (lines.length && !lines[0].trim()) lines.shift()
  const body = lines.join('\n')
  const tokens = [churchName, ...emphasis]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
  const pattern = new RegExp(
    '(' +
      tokens
        .map((value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('|') +
      ')',
    'gi'
  )
  const formatLine = (line: string) =>
    line
      .split(pattern)
      .map((part, i) =>
        tokens.some((value) => value.toLowerCase() === part.toLowerCase()) ? (
          <strong key={i}>{part}</strong>
        ) : (
          part
        )
      )
  return (
    <article className="letter-paper">
      <header>
        <BrandLogo />
        <div>
          <h2>{churchName || 'Iglesia Evangélica Dios Fuerte'}</h2>
          {address && <p>{address}</p>}
          {phone && <p>Tel: {phone}</p>}
        </div>
      </header>
      <p className="letter-document-date">
        {date ||
          embeddedDate ||
          new Date().toLocaleDateString('es-DO', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: 'America/Santo_Domingo'
          })}
      </p>
      <div className="letter-paper-body">
        {body.split('\n').map((line, i) => {
          if (!line.trim())
            return <div className="letter-paragraph-gap" key={i} />
          const recipient = line.match(
            /^(Iglesia|Pastor\/a\/es|Pastor\/a|Pastor|Pastora|Dirigido a|Señor\/a):\s*(.*)$/i
          )
          return recipient ? (
            <p className="letter-recipient" key={i}>
              {recipient[1]}: <strong>{recipient[2]}</strong>
            </p>
          ) : (
            <p key={i}>{formatLine(line)}</p>
          )
        })}
      </div>
      {pastor && (
        <div className="letter-paper-signature">
          <span />
          <p>{pastorTitle || 'Pastor'}</p>
          <strong>{pastor}</strong>
          <BrandLogo />
        </div>
      )}
    </article>
  )
}
