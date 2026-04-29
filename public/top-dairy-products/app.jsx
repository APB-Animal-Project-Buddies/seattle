// Top Dairy Products — standalone page, renders the DairyTab view from /recipes/components.jsx.

function App() {
  const dairy = window.APB_DAIRY || null;
  if (!dairy) {
    return (
      <div className="empty-state">
        <h3>Dairy data missing</h3>
        <p>Run the parser:</p>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 12, opacity: 0.7, marginTop: 12 }}>
          bun recipes/base_document/scripts/parse-catalog.ts
        </p>
      </div>
    );
  }
  return <window.DairyTab data={dairy} />;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
