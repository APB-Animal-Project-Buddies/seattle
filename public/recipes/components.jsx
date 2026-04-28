// UI components: Hero, SubTabs, MenuPill, SearchBox, FilterChips, CuisineBar, Toolbar,
// RecipeCard, RecipeModal, MenuDrawer, DairyTab, Toast.
// All exposed on window for app.jsx to compose.

const { useState, useEffect, useMemo } = React;

// ---------- Hero ----------
function Hero({ featured, stats }) {
  const palette = featured ? window.paletteFor(featured.cuisine) : window.PALETTES.italian;
  return (
    <section className="hero">
      <div>
        <div className="eyebrow"><span className="dot"/>Recipes · Curated for restaurant kitchens</div>
        <h1>
          Make your food <em className="fresh-accent">fresh</em>, <em>tasty</em>,<br />
          <span className="leaf"></span>and <em>compassionate</em>.
        </h1>
        <p className="lede">
          A working library of plant-based dishes built for the line — vetted by chefs,
          costed for restaurants, scaled to service. Restaurant-grade, weeknight-easy.
          <strong className="creed"> No killing, no animals hurt, no cruelty.</strong>
        </p>
        <div className="stats">
          <div className="stat"><div className="num">{stats.recipes}</div><div className="lbl">Tested recipes</div></div>
          <div className="stat"><div className="num">{stats.cuisines}</div><div className="lbl">Cuisines</div></div>
          <div className="stat"><div className="num">${stats.avgCost.toFixed(2)}</div><div className="lbl">Avg cost / plate</div></div>
        </div>
      </div>
      {featured && (
        <div className="hero-card">
          <div className="ph">
            {featured.image
              ? <img src={featured.image} alt={featured.title} loading="eager" />
              : <window.PhotoPH palette={palette} dish={featured.photo} label={featured.photoLabel} />}
            <div className="tag">Pick of the week</div>
          </div>
          <h3>{featured.title}</h3>
          <div className="meta">
            <span>{featured.cuisineName}</span>
            <span>·</span>
            <span>{featured.time || featured.prep || '—'}</span>
            <span>·</span>
            <span>{window.fmtCost(featured.cost)} / plate</span>
          </div>
        </div>
      )}
    </section>
  );
}

// ---------- SubTabs ----------
function SubTabs({ active, onChange, recipeCount, onOpenMenu, menuCount }) {
  return (
    <div className="sub-tabs">
      <button
        className={"sub-tab" + (active === 'recipes' ? ' on' : '')}
        onClick={() => onChange('recipes')}
      >Recipes <span className="ct">{recipeCount}</span></button>
      <button
        className={"sub-tab" + (active === 'dairy' ? ' on' : '')}
        onClick={() => onChange('dairy')}
      >Top dairy products <span className="ct">10</span></button>
      <div style={{ marginLeft: 'auto' }} />
      {active === 'recipes' && (
        <button className="menu-btn" onClick={onOpenMenu} style={{
          alignSelf: 'center',
          marginBottom: 8,
          padding: '8px 14px',
          borderRadius: 999,
          background: 'var(--moss)',
          color: 'var(--cream)',
          fontWeight: 600,
          fontSize: 13,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h10M4 18h16"/></svg>
          Your menu
          <span style={{
            display: 'inline-grid', placeItems: 'center',
            minWidth: 20, height: 20, padding: '0 6px',
            borderRadius: 999,
            background: 'var(--mustard)',
            color: 'var(--moss-ink)',
            fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600,
          }}>{menuCount}</span>
        </button>
      )}
    </div>
  );
}

// ---------- SearchBox ----------
function SearchBox({ value, onChange, placeholder }) {
  return (
    <div className="search-box">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="7"/>
        <path d="M20 20l-3-3"/>
      </svg>
      <input
        type="text"
        value={value}
        placeholder={placeholder || 'Search recipes…'}
        onChange={e => onChange(e.target.value)}
      />
      {value && <button className="clear" onClick={() => onChange('')}>Clear</button>}
    </div>
  );
}

// ---------- FilterChips ----------
function FilterChips({ activeCourse, onCourseChange, activeSourcing, onSourcingChange, activeTags, onTagToggle }) {
  return (
    <>
      <div className="group">
        <span className="group-label">Course</span>
        <div className="fchip-group">
          {[
            { id: 'all', name: 'All' },
            { id: 'starter', name: 'Starter' },
            { id: 'main', name: 'Main' },
            { id: 'showstopper', name: 'Showstopper' },
            { id: 'dessert', name: 'Dessert' },
          ].map(c => (
            <button
              key={c.id}
              className={"fchip" + (activeCourse === c.id ? ' on' : '')}
              onClick={() => onCourseChange(c.id)}
            >{c.name}</button>
          ))}
        </div>
      </div>

      <div className="group">
        <span className="group-label">Sourcing</span>
        <div className="fchip-group">
          {[
            { id: 'all', name: 'All' },
            { id: 'in-house', name: '🌿 In-house only' },
            { id: 'branded', name: '🥩 Branded' },
          ].map(s => (
            <button
              key={s.id}
              className={"fchip" + (activeSourcing === s.id ? ' on' : '')}
              onClick={() => onSourcingChange(s.id)}
            >{s.name}</button>
          ))}
        </div>
      </div>

      <div className="group">
        <span className="group-label">Operations</span>
        <div className="fchip-group">
          {[
            { id: 'bulk-prep', name: '🥘 Bulk-prep' },
            { id: 'fast-service', name: '⚡ Fast-service' },
          ].map(t => (
            <button
              key={t.id}
              className={"fchip" + (activeTags.includes(t.id) ? ' on' : '')}
              onClick={() => onTagToggle(t.id)}
            >{t.name}</button>
          ))}
        </div>
      </div>
    </>
  );
}

// ---------- CuisineBar ----------
function CuisineBar({ active, onChange, counts }) {
  return (
    <div className="cuisine-bar">
      {window.CUISINE_META.map(c => (
        <button
          key={c.id}
          className={"chip" + (active === c.id ? " active" : "")}
          onClick={() => onChange(c.id)}
        >
          {c.name}
          <span className="ct">{counts[c.id] ?? 0}</span>
        </button>
      ))}
    </div>
  );
}

// ---------- Toolbar ----------
function Toolbar({ count, activeName, sortBy, onSortChange }) {
  const sorts = [
    { id: 'curated', name: 'Curated' },
    { id: 'time',    name: 'Quickest' },
    { id: 'cost',    name: 'Lowest cost' },
    { id: 'easy',    name: 'Easiest' },
  ];
  return (
    <div className="toolbar">
      <div className="lhs">
        <h2>{activeName}</h2>
        <span className="ct">{count} {window.pluralize(count, 'recipe')}</span>
      </div>
      <div className="filters">
        {sorts.map(s => (
          <button
            key={s.id}
            className={"fchip" + (sortBy === s.id ? " on" : "")}
            onClick={() => onSortChange(s.id)}
          >{s.name}</button>
        ))}
      </div>
    </div>
  );
}

// Renders inline **bold** markdown in a string to safe HTML.
function renderInlineMd(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

// Classify cost-delta by sign only:
//   - / − → green (cheaper to cook)
//   +     → red   (more expensive)
//   baseline / n/a → neutral
function classifyDelta(delta) {
  const s = String(delta || '').trim().toLowerCase();
  if (!s || s === 'n/a' || s === '—' || s.includes('baseline')) return 'neutral';
  if (/^[-−]/.test(s)) return 'help';
  if (/^\+/.test(s)) return 'warn';
  return 'neutral';
}

// ---------- RecipeCard ----------
function RecipeCard({ recipe, saved, inMenu, onToggleSave, onAddToMenu, onOpen }) {
  const palette = window.paletteFor(recipe.cuisine);
  return (
    <article className="card" onClick={() => onOpen(recipe)}>
      <div className="photo">
        {recipe.image
          ? <img src={recipe.image} alt={recipe.title} loading="lazy" />
          : <window.PhotoPH palette={palette} dish={recipe.photo} label={recipe.photoLabel} />}
        {recipe.badge && <div className="badge" data-tier={(recipe.valueTier || '').toLowerCase().replace(/\s+/g, '-')}>{recipe.badge}</div>}
        <button
          className={"save" + (saved ? ' saved' : '')}
          onClick={(e) => { e.stopPropagation(); onToggleSave(recipe.id); }}
          aria-label="Save"
        >
          <svg viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
        {recipe.sourcingTier && recipe.sourcingTier !== 'in-house' && (
          <div className={"tier-mark " + recipe.sourcingTier}>
            {recipe.sourcingTier === 'branded' ? '🥩 Branded' : '🌿🥩 Hybrid'}
          </div>
        )}
      </div>
      <div className="body">
        <div className="cuisine">{recipe.cuisineName}</div>
        <h3>{recipe.title}</h3>
        {recipe.source && <div className="source">— {recipe.source}</div>}
        <p className="why" dangerouslySetInnerHTML={{ __html: renderInlineMd(recipe.description) }} />
        <div className="meta">
          <div className="m"><div className="v">{recipe.time || recipe.prep || '—'}</div><div className="l">Prep</div></div>
          <div className="m"><div className="v">{recipe.servings ?? '—'}</div><div className="l">Serves</div></div>
          <div className="m"><div className="v"><window.DiffDots n={recipe.difficulty || 1} /></div><div className="l">Effort</div></div>
          <div className="m"><div className="v">{window.fmtCost(recipe.cost)}</div><div className="l">/ plate</div></div>
        </div>
      </div>
      <button
        className={"add-btn" + (inMenu ? ' added' : '')}
        onClick={(e) => { e.stopPropagation(); onAddToMenu(recipe); }}
        aria-label={inMenu ? 'In menu' : 'Add to menu'}
        title={inMenu ? 'In menu' : 'Add to menu'}
      >
        {inMenu ? '✓' : '+'}
      </button>
    </article>
  );
}

// ---------- RecipeModal ----------
function RecipeModal({ recipe, open, onClose, onAddToMenu, inMenu }) {
  if (!recipe) return null;
  const palette = window.paletteFor(recipe.cuisine);
  const isTechnique = recipe.urlStatus === 'reference-technique';
  return (
    <div className={"modal-backdrop" + (open ? " open" : "")} onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M6 18L18 6"/></svg>
        </button>
        <div className="left">
          <div className="ph">
            {recipe.image
              ? <img src={recipe.image} alt={recipe.title} loading="eager" />
              : <window.PhotoPH palette={palette} dish={recipe.photo} label={recipe.photoLabel} />}
          </div>
        </div>
        <div className="right">
          <div className="head">
            <div>
              <div className="cuisine-tag">
                {recipe.cuisineName}
                {recipe.courses && recipe.courses.map(c => (
                  c !== 'main' ? <span key={c} style={{
                    marginLeft: 8, padding: '2px 8px',
                    background: 'oklch(0.62 0.14 45 / 0.16)', color: 'var(--terracotta)',
                    borderRadius: 999, fontSize: 10, textTransform: 'uppercase', letterSpacing: '.1em'
                  }}>{c}</span> : null
                ))}
              </div>
              <h2>{recipe.title}</h2>
              {recipe.source && <div className="source modal-source">— {recipe.source}</div>}
              <div style={{ marginTop: 8 }}>
                <window.UrlStatusBadge status={recipe.urlStatus} />
              </div>
            </div>
          </div>

          <div className="why-block" dangerouslySetInnerHTML={{ __html: renderInlineMd(recipe.description) }} />

          {recipe.url && (
            <div className="url-block">
              <span className="url-text">{recipe.url}</span>
              <a href={recipe.url} target="_blank" rel="noopener noreferrer" className="primary" style={{
                padding: '6px 12px', borderRadius: 999,
                background: 'var(--moss)', color: 'var(--cream)',
                textDecoration: 'none', fontSize: 12, fontWeight: 600
              }}>Open ↗</a>
            </div>
          )}

          {recipe.urlNote && <div className="url-note">"{recipe.urlNote}"</div>}

          {recipe.alternatives && recipe.alternatives.length > 0 && (
            <div className="alternatives">
              <h4>Alternative recipes</h4>
              <ul>
                {recipe.alternatives.map((alt, i) => (
                  <li key={i}>
                    <a href={alt.url} target="_blank" rel="noopener noreferrer">{alt.source} ↗</a>
                    <span className="alt-note">{alt.note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isTechnique && (
            <div style={{
              padding: '10px 14px', borderRadius: 12,
              background: 'oklch(0.62 0.14 45 / 0.10)', color: 'var(--terracotta)',
              fontSize: 13, lineHeight: 1.45, marginBottom: 12,
            }}>
              <strong>Note:</strong> The linked recipe is a non-vegan technique tutorial. Use the substitution table below as the operative recipe.
            </div>
          )}

          <div className="meta-row">
            <div className="b"><div className="l">Prep</div><div className="v">{recipe.time || recipe.prep || '—'}</div></div>
            <div className="b"><div className="l">Serves</div><div className="v">{recipe.servings ?? '—'}</div></div>
            <div className="b"><div className="l">Effort</div><div className="v"><window.DiffDots n={recipe.difficulty || 1} /></div></div>
            <div className="b"><div className="l">/ plate</div><div className="v">{window.fmtCost(recipe.cost)}</div></div>
          </div>

          {recipe.menuPrice && (
            <div style={{ fontSize: 13, color: 'oklch(0.18 0.04 145 / 0.65)', marginBottom: 8 }}>
              <strong style={{ color: 'var(--moss-ink)' }}>Menu price:</strong> {recipe.menuPrice}
              {recipe.valueRatio != null && recipe.valueTier && (
                <span className={"value-tier-tag tier-" + recipe.valueTier.toLowerCase().replace(/\s+/g, '-')}>
                  {recipe.valueRatio.toFixed(1)}× return · {recipe.valueTier}
                </span>
              )}
            </div>
          )}

          {recipe.tags && recipe.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {recipe.tags.includes('bulk-prep') && (
                <span style={{ padding: '4px 10px', borderRadius: 999, background: 'oklch(0.78 0.13 85 / 0.20)', color: 'oklch(0.45 0.10 85)', fontSize: 11, fontWeight: 600 }}>🥘 Bulk-prep</span>
              )}
              {recipe.tags.includes('fast-service') && (
                <span style={{ padding: '4px 10px', borderRadius: 999, background: 'oklch(0.68 0.16 140 / 0.18)', color: 'oklch(0.30 0.10 140)', fontSize: 11, fontWeight: 600 }}>⚡ Fast-service</span>
              )}
            </div>
          )}

          {recipe.subs && recipe.subs.length > 0 && (
            <div>
              <h4>{isTechnique ? 'Operative recipe — substitutions' : 'Allergen & dietary swaps'}</h4>
              <table className="subs-table">
                <thead>
                  <tr>
                    <th>Sub</th>
                    <th>Effect</th>
                    <th>Cost delta</th>
                  </tr>
                </thead>
                <tbody>
                  {recipe.subs.map((s, i) => (
                    <tr key={i}>
                      <td dangerouslySetInnerHTML={{ __html: s.from.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') }} />
                      <td>{s.effect}</td>
                      <td className={"delta " + classifyDelta(s.delta)}>{s.delta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="modal-actions">
            <a href={recipe.url || '#'} target="_blank" rel="noopener noreferrer" style={{
              padding: '12px 20px', borderRadius: 999, border: '1px solid var(--line)',
              textDecoration: 'none', color: 'var(--moss-ink)', fontWeight: 600, fontSize: 13.5,
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>
              View full recipe
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M7 17L17 7M9 7h8v8"/></svg>
            </a>
            <button className="primary" onClick={() => onAddToMenu(recipe)}>
              {inMenu ? '✓ In your menu' : '+ Add to menu'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- MenuDrawer ----------
function MenuDrawer({ open, items, onClose, onChangeQty, onRemove, menuName, setMenuName, servings, setServings }) {
  const itemCount = items.reduce((s, it) => s + it.qty, 0);
  const totalPerPlate = items.reduce((s, it) => s + (it.cost || 0) * it.qty, 0);
  const avgPerPlate = itemCount ? totalPerPlate / itemCount : 0;
  const totalForGuests = totalPerPlate * servings;

  function exportPdf() {
    document.body.classList.add('printing-menu');
    window.print();
    setTimeout(() => document.body.classList.remove('printing-menu'), 500);
  }

  function sendToKitchen() {
    const lines = [
      `Menu: ${menuName}`,
      `Food cost: $${totalPerPlate.toFixed(2)} / plate · $${totalForGuests.toFixed(2)} for ${servings} guests`,
      ``,
      `Dishes:`,
      ...items.map(it => `  • ${it.title} — ×${it.qty} @ ${window.fmtCost(it.cost)}/plate`),
      ``,
      `Generated from animalprojectbuddies.com/recipes`,
    ];
    const subject = encodeURIComponent(`Menu: ${menuName}`);
    const body = encodeURIComponent(lines.join('\n'));
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  return (
    <>
      <div className={"drawer-backdrop" + (open ? " open" : "")} onClick={onClose} />
      <aside className={"drawer" + (open ? " open" : "")} aria-hidden={!open}>
        <div className="dhead">
          <div>
            <h2>Build your menu</h2>
            <div className="sub">{itemCount} {window.pluralize(itemCount, 'dish', 'dishes')} · for {servings} guests</div>
          </div>
          <button className="close" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M6 18L18 6"/></svg>
          </button>
        </div>
        <input
          className="name-input"
          value={menuName}
          onChange={e => setMenuName(e.target.value)}
          placeholder="Menu name"
        />
        <div className="body">
          {items.length === 0 ? (
            <div className="empty">
              <strong>Start your menu.</strong>
              Tap the <span style={{display:'inline-grid', placeItems:'center', width:22, height:22, borderRadius:999, background:'var(--moss)', color:'var(--cream)', fontWeight:600, verticalAlign:'middle'}}>+</span> on any recipe to add it here.
            </div>
          ) : items.map(it => (
            <div key={it.id} className="row">
              <div className="thumb">
                {it.image
                  ? <img src={it.image} alt={it.title} loading="lazy" />
                  : <window.PhotoPH palette={window.paletteFor(it.cuisine)} dish={it.photo} label="" />}
              </div>
              <div className="info">
                <div className="t">{it.title}</div>
                <div className="m">{it.cuisineName} · {it.time || it.prep || '—'}</div>
                <div className="qty">
                  <button onClick={() => onChangeQty(it.id, Math.max(1, it.qty - 1))}>−</button>
                  <span className="v">×{it.qty}</span>
                  <button onClick={() => onChangeQty(it.id, it.qty + 1)}>+</button>
                </div>
              </div>
              <div className="price">${((it.cost || 0) * it.qty).toFixed(2)}<span className="price-unit"> / plate</span></div>
              <button className="x" onClick={() => onRemove(it.id)} aria-label="Remove">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M6 18L18 6"/></svg>
              </button>
            </div>
          ))}
        </div>
        <div className="summary">
          <div className="servings">
            <div>
              <div className="lbl">Service size</div>
            </div>
            <div className="picker">
              <button onClick={() => setServings(Math.max(2, servings - 2))}>−</button>
              <span className="v">{servings} guests</span>
              <button onClick={() => setServings(servings + 2)}>+</button>
            </div>
          </div>
          <div className="totals">
            <div className="t">
              <div className="l">Avg / plate</div>
              <div className="v">${avgPerPlate.toFixed(2)}</div>
            </div>
            <div className="t grand">
              <div className="l">Food cost / plate</div>
              <div className="v">${totalPerPlate.toFixed(2)}</div>
            </div>
            <div className="t totals-footnote">
              <div className="l">For {servings} guests</div>
              <div className="v">${totalForGuests.toFixed(0)} total</div>
            </div>
          </div>
          <div className="actions">
            <button onClick={exportPdf} disabled={items.length === 0}>Export PDF</button>
            <button className="primary" onClick={sendToKitchen} disabled={items.length === 0}>Send to kitchen</button>
          </div>
        </div>
      </aside>
    </>
  );
}

// ---------- DairyTab ----------
function DairyTab({ data }) {
  if (!data) {
    return <div className="loading-state"><div className="spinner" />Loading dairy picks…</div>;
  }
  const winners = data.categories.filter(c => c.tastyAward);
  return (
    <main className="dairy">
      <div className="dairy-head">
        <div className="eyebrow"><span className="dot"/>Top products · Nectar plant-based dairy study {data.asOf}</div>
        <h2>
          Dairy you can <em>swap</em> today.
        </h2>
        <p className="lede">
          Chef-tested, taste-tested, and operator-priced. The picks below replace dairy on the line without retraining the kitchen — drawn from {data.studyDescription.toLowerCase()}
        </p>
        {data.summary && data.summary.headlineWinner && (
          <div className="dairy-headline">
            <span className="star">★</span>
            {data.summary.headlineWinner.brand} reached taste parity in {data.summary.headlineWinner.category.toLowerCase()}.
          </div>
        )}
      </div>

      {winners.length > 0 && (
        <section className="tasty-board">
          <div className="tasty-board-head">
            <span className="tasty-tag">★ TASTY Award Winners</span>
            <h3>Best plant-based product, by category.</h3>
            <p>Top picks across the {winners.length} categories with TASTY-award-eligible products in Nectar's blind taste test.</p>
          </div>
          <ol className="tasty-list">
            {winners.map((c, i) => (
              <li key={c.id}>
                <span className="rank">{String(i + 1).padStart(2, '0')}</span>
                <span className="cat-icon"><window.DairyIcon name={c.icon} /></span>
                <div className="winner-info">
                  <div className="cat-name">{c.name}</div>
                  <div className="brand">{c.leader}</div>
                  <div className="use">{c.use}</div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="dairy-grid">
        {data.categories.map(cat => (
          <article key={cat.id} className="dairy-card">
            <div className="icon-frame"><window.DairyIcon name={cat.icon} /></div>
            <div className="cat-block">
              <div className="cat">{cat.name}</div>
              <div className="use">{cat.use}</div>
            </div>
            {cat.tastyAward
              ? <span className="tasty-tag">★ TASTY award winners</span>
              : <span className="tasty-tag warning">Still developing</span>
            }
            <p className="blurb">{cat.blurb}</p>
            <ul className="picks">
              {cat.picks.map(pk => (
                <li key={pk.brand}>
                  <span className="brand">{pk.brand}</span>
                  <span className="note">{pk.note}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="dairy-foot">
        Top products distilled from <a href={data.sourceUrl} target="_blank" rel="noopener noreferrer">{data.source}</a>.
        We will return to highlight more findings from the study soon.
      </div>
    </main>
  );
}

// ---------- Toast ----------
function Toast({ message, show }) {
  return (
    <div className={"toast" + (show ? " show" : "")}>
      <span className="dot" />
      {message}
    </div>
  );
}

Object.assign(window, {
  Hero, SubTabs, SearchBox, FilterChips, CuisineBar, Toolbar,
  RecipeCard, RecipeModal, MenuDrawer, DairyTab, Toast,
});
