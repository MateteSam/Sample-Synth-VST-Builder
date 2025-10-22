(async () => {
  const fetch = globalThis.fetch || (await import('node-fetch')).default;
  const base = 'http://localhost:3000';
  const body = { options: { zip: true, runBuilder: true } };
  try {
    const p = await fetch(base + '/api/export_async', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const j = await p.json();
    const stamp = j.stamp;
    console.log('STAMP:', stamp);
    for (let i = 0; i < 240; ++i) {
      const s = await (await fetch(base + '/api/export/status/' + stamp)).json();
      console.log(`${s.progress}% - ${s.message}`);
      if ((s.progress || 0) >= 100) {
        const res = await (await fetch(base + '/api/export/result/' + stamp)).json().catch(() => null);
        console.log('RESULT:', res);
        process.exit(0);
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
    console.error('Timed out waiting for export');
    process.exit(2);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
