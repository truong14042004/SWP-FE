const apiUrl = import.meta.env.VITE_API_URL;

export default function App() {
  return (
    <main className="app-shell">
      <section className="panel">
        <p className="eyebrow">React + Vite</p>
        <h1>SWP Frontend</h1>
        <p className="description">
          Project is ready for local development and Firebase Hosting deployment.
        </p>
        <dl className="config-list">
          <div>
            <dt>API URL</dt>
            <dd>{apiUrl}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
