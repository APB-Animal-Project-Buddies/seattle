// Top Alternatives — renders Plant-Based Dairy + Plant-Based Meat sections.

function App() {
  const dairy = window.APB_DAIRY || null;
  const meats = window.APB_MEATS || null;

  if (!dairy && !meats) {
    return (
      <div className="empty-state">
        <h3>Data missing</h3>
        <p>Ensure _dairy.js and _meats.js are loaded.</p>
      </div>
    );
  }

  // Split each section into strong (≥40% same-or-better OR has TASTY/parity)
  // and improving (still-developing) cards. Improving cards from dairy + meat
  // get merged into a single "Still Developing" section at the very bottom.
  function isStrong(c) {
    if (c.tasteParity || c.tastyAward) return true;
    if ((c.picks || []).some(p => p.tasteParity || p.tastyAward)) return true;
    if (c.sameOrBetterPct != null && c.sameOrBetterPct >= 40) return true;
    return false;
  }
  function split(data, parityLabel) {
    if (!data) return { strong: null, weak: [], parityLabel };
    const strong = data.categories.filter(isStrong);
    const weak = data.categories.filter(c => !isStrong(c));
    return {
      strong: strong.length ? { ...data, categories: strong } : null,
      weak: weak.map(c => ({ ...c, _parityLabel: parityLabel })),
      parityLabel,
    };
  }

  const meatSplit = split(meats, 'As good as meat');
  const dairySplit = split(dairy, 'As good as dairy');
  const allWeak = [...meatSplit.weak, ...dairySplit.weak];

  return (
    <main style={{ paddingBottom: 96 }}>
      {meatSplit.strong && (
        <window.AlternativesTab
          data={meatSplit.strong}
          sectionLabel="Plant-Based Meat"
          parityLabel="As good as meat"
        />
      )}
      {meats?.apbRecommended && (
        <window.AlternativesTab
          data={meats.apbRecommended}
          sectionLabel="APB Recommends · Premium Cuts"
          parityLabel="APB pick"
        />
      )}
      {dairySplit.strong && (
        <window.AlternativesTab
          data={dairySplit.strong}
          sectionLabel="Plant-Based Dairy"
          parityLabel="As good as dairy"
        />
      )}
      {allWeak.length > 0 && (
        <window.AlternativesTab
          data={{
            categories: allWeak,
            headline: "Categories where the leader hasn't hit the 40% same-or-better bar yet — strong R&D opportunities for restaurateurs and brands alike.",
          }}
          sectionLabel="Still Developing"
          parityLabel="Same as animal"
        />
      )}
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
