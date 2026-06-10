function ghHeaders() {
  const token = process.env.GITHUB_TOKEN;
  return {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'codeaptor-discover/1.0',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default async function discoverFromGitHub(existingNames) {
  const candidates = [];
  const queries = [
    { q: 'topic:cli stars:>50', perPage: 100 },
    { q: 'topic:cli topic:ai stars:>20', perPage: 25 },
    { q: 'topic:cli topic:devops stars:>20', perPage: 25 },
    { q: 'topic:cli topic:database stars:>20', perPage: 25 },
    { q: 'topic:cli topic:security stars:>20', perPage: 25 },
    { q: 'topic:cli topic:kubernetes stars:>20', perPage: 25 },
    { q: 'topic:cli topic:automation stars:>20', perPage: 25 },
    { q: 'topic:cli topic:productivity stars:>20', perPage: 25 },
  ];

  for (const { q, perPage } of queries) {
    try {
      const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=${perPage}`;
      const res = await fetch(url, { headers: ghHeaders() });
      if (!res.ok) {
        console.warn(`  ⚠ GitHub search "${q.split(' ')[0]}…": ${res.status}`);
        continue;
      }
      const data = await res.json();
      for (const repo of data.items || []) {
        const name = repo.name.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
        if (existingNames.has(name)) continue;
        candidates.push({
          source: 'github',
          name,
          displayName: repo.name,
          description: repo.description || '',
          officialUrl: repo.html_url,
          stars: repo.stargazers_count || 0,
          language: repo.language || '',
          rawData: {
            name: repo.name,
            description: repo.description,
            topics: repo.topics,
            language: repo.language,
            stars: repo.stargazers_count,
            html_url: repo.html_url,
            homepage: repo.homepage,
          },
        });
      }
    } catch (e) {
      console.warn(`  ⚠ GitHub error: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 1200));
  }

  return candidates;
}
