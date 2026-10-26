import { TrendingUp, TrendingDown, ArrowUpRight, Wallet } from 'lucide-react'

export const money = (value: number) =>
  'RD$ ' +
  new Intl.NumberFormat('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value) || 0)

export function FinanceInsights({
  summary,
  onIncome,
  onExpense
}: {
  summary: any
  onIncome: () => void
  onExpense: () => void
}) {
  const income = Number(summary?.totals?.income) || 0
  const expense = Number(summary?.totals?.expense) || 0
  const maximum = Math.max(income, expense, 1)
  const categories = (summary?.byCategory || [])
    .filter((category: any) => category.total > 0)
    .slice(0, 6)
  return (
    <section className="finance-insights" aria-label="Distribución del período">
      <div className="finance-section-heading">
        <span className="finance-icon">
          <Wallet size={18} />
        </span>
        <div>
          <h2>El período en perspectiva</h2>
          <p>Ingresos y gastos registrados</p>
        </div>
      </div>
      <div className="finance-comparison">
        {[
          {
            name: 'Ingresos',
            value: income,
            action: onIncome,
            className: 'is-income',
            icon: TrendingUp
          },
          {
            name: 'Gastos',
            value: expense,
            action: onExpense,
            className: 'is-expense',
            icon: TrendingDown
          }
        ].map((item) => (
          <button
            key={item.name}
            className={`finance-comparison-row ${item.className}`}
            onClick={item.action}
            aria-label={`Filtrar movimientos: ${item.name}`}
          >
            <span className="finance-comparison-label">
              <span>
                <item.icon size={15} />
                {item.name}
              </span>
              <strong>{money(item.value)}</strong>
            </span>
            <span className="finance-comparison-track">
              <span style={{ width: `${(item.value / maximum) * 100}%` }} />
            </span>
          </button>
        ))}
      </div>
      <div className="finance-distribution-heading">
        <h3>Por categoría</h3>
        <span>{categories.length} categorías</span>
      </div>
      {categories.length ? (
        categories.map((category: any) => {
          const total = category.type === 'INCOME' ? income : expense
          const ratio =
            total > 0 ? Math.min(100, (category.total / total) * 100) : 0
          return (
            <div className="finance-category-line" key={category._id}>
              <div>
                <span
                  className="finance-category-dot"
                  style={{ background: category.color || '#bd922f' }}
                />
                <span>{category.name}</span>
                <strong>{money(category.total)}</strong>
              </div>
              <div className="finance-category-track">
                <span
                  style={{
                    width: `${ratio}%`,
                    background: category.color || '#bd922f'
                  }}
                />
              </div>
            </div>
          )
        })
      ) : (
        <p className="finance-muted">
          Las categorías aparecerán cuando registres movimientos en este
          período.
        </p>
      )}
      <p className="finance-insight-note">
        <ArrowUpRight size={14} /> Pulsa ingresos o gastos para consultar sus
        movimientos.
      </p>
    </section>
  )
}
