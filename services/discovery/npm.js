export default async function discoverFromNpm(existingNames) {
  const candidates = [];

  try {
    const res = await fetch(
      'https://registry.npmjs.org/-/v1/search?text=keywords:cli&size=100&popularity=1.0',
      { headers: { Accept: 'application/json' } },
    );
    if (!res.ok) {
      console.warn(`  ⚠ npm search: ${res.status}`);
      return candidates;
    }

    const data = await res.json();
    for (const obj of data.objects || []) {
      const pkg = obj.package;
      const name = pkg.name.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
      if (existingNames.has(name)) continue;

      candidates.push({
        source: 'npm',
        name,
        displayName: pkg.name,
        description: pkg.description || '',
        officialUrl: pkg.links?.repository || pkg.links?.homepage || pkg.links?.npm || '',
        stars: Math.round((obj.score?.detail?.popularity || 0) * 10000),
        language: 'JavaScript',
        rawData: {
          name: pkg.name,
          description: pkg.description,
          keywords: pkg.keywords,
          version: pkg.version,
          date: pkg.date,
          links: pkg.links,
          publisher: pkg.publisher?.username,
        },
      });
    }
  } catch (e) {
    console.warn(`  ⚠ npm error: ${e.message}`);
  }

  return candidates;
}
