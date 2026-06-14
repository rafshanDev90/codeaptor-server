import mongoose from 'mongoose';

export function registerHealthRoutes(app) {
  app.get('/health', async (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'up' : 'down';
    res.status(dbStatus === 'up' ? 200 : 503).json({
      status: dbStatus === 'up' ? 'success' : 'error',
      timestamp: new Date(),
      services: { database: dbStatus, server: 'up' },
    });
  });

  app.get('/api/sitemap.xml', async (req, res) => {
    const BASE_URL = 'https://getcli.vercel.app';

    try {
      const CliTool = mongoose.model('CliTool');
      const Category = mongoose.model('Category');

      const [tools, categories] = await Promise.all([
        CliTool.find({ isActive: true }, { name: 1, displayName: 1, updatedAt: 1 }).lean(),
        Category.find({}, { slug: 1, name: 1 }).sort({ displayOrder: 1 }).lean(),
      ]);

      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

      xml += `  <url><loc>${BASE_URL}/</loc><changefreq>weekly</changefreq><priority>1</priority></url>\n`;
      xml += `  <url><loc>${BASE_URL}/browse</loc><changefreq>daily</changefreq><priority>0.9</priority></url>\n`;
      xml += `  <url><loc>${BASE_URL}/terms</loc><changefreq>monthly</changefreq><priority>0.3</priority></url>\n`;
      xml += `  <url><loc>${BASE_URL}/privacy</loc><changefreq>monthly</changefreq><priority>0.3</priority></url>\n`;

      for (const tool of tools) {
        const date = tool.updatedAt ? new Date(tool.updatedAt).toISOString() : new Date().toISOString();
        xml += `  <url><loc>${BASE_URL}/tool/${tool.name}</loc><lastmod>${date}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>\n`;
      }

      for (const cat of categories) {
        xml += `  <url><loc>${BASE_URL}/browse?category=${cat.slug}</loc><changefreq>weekly</changefreq><priority>0.5</priority></url>\n`;
      }

      xml += '</urlset>';

      res.set('Content-Type', 'application/xml');
      res.set('Cache-Control', 'public, max-age=3600, s-maxage=86400');
      res.send(xml);
    } catch (err) {
      res.status(500).set('Content-Type', 'application/xml').send(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
        `  <url><loc>${BASE_URL}/</loc><changefreq>weekly</changefreq><priority>1</priority></url>\n` +
        `  <url><loc>${BASE_URL}/browse</loc><changefreq>daily</changefreq><priority>0.9</priority></url>\n` +
        '</urlset>'
      );
    }
  });
}
