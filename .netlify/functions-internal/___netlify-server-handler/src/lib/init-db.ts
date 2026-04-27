import { getDb, upsertAgent, getAllAgents } from './db';
import https from 'https';
import http from 'http';

const GITHUB_REPO = 'itallstartedwithaidea/agency-agents';
const GITHUB_BRANCH = 'main';

interface GitHubTreeItem {
  path: string;
  type: 'blob' | 'tree';
  sha: string;
  url?: string;
}

interface GitHubTree {
  tree: GitHubTreeItem[];
  truncated: boolean;
}

function fetchJson<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.get(url, { headers: { 'User-Agent': 'Mission-Control/1.0' } }, (res) => {
      // Handle redirects
      if (res.statusCode === 301 || res.statusCode === 302) {
        const redirectUrl = res.headers.location;
        if (redirectUrl) {
          fetchJson<T>(redirectUrl).then(resolve).catch(reject);
          return;
        }
      }
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse JSON from ${url}: ${data.slice(0, 100)}`));
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error(`Request timeout for ${url}`));
    });
  });
}

function fetchFileContent(downloadUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(downloadUrl, { headers: { 'User-Agent': 'Mission-Control/1.0' } }, (res) => {
      // Handle redirects
      if (res.statusCode === 301 || res.statusCode === 302) {
        const redirectUrl = res.headers.location;
        if (redirectUrl) {
          fetchFileContent(redirectUrl).then(resolve).catch(reject);
          return;
        }
      }
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function loadAgentsFromGitHub(): Promise<void> {
  console.log(`Fetching agent list from GitHub: ${GITHUB_REPO}/${GITHUB_BRANCH}`);
  
  const treeUrl = `https://api.github.com/repos/${GITHUB_REPO}/git/trees/${GITHUB_BRANCH}?recursive=1`;
  const tree = await fetchJson<GitHubTree>(treeUrl);
  
  // Filter only markdown files
  const mdFiles = tree.tree.filter(item => 
    item.type === 'blob' && item.path.endsWith('.md')
  );
  
  console.log(`Found ${mdFiles.length} markdown files`);
  
  // Process in batches to avoid rate limiting
  const batchSize = 10;
  let loaded = 0;
  
  for (let i = 0; i < mdFiles.length; i += batchSize) {
    const batch = mdFiles.slice(i, i + batchSize);
    console.log(`\nProcessing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(mdFiles.length / batchSize)}...`);
    
    await Promise.all(batch.map(async (file) => {
      try {
        const downloadUrl = `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/${file.path}`;
        const content = await fetchFileContent(downloadUrl);
        
        // Parse filename as slug
        const filename = file.path.split('/').pop() || '';
        const slug = filename.replace('.md', '').toLowerCase().replace(/\s+/g, '-');
        
        // Extract name from filename or frontmatter
        let name = filename.replace('.md', '').replace(/-/g, ' ');
        let description: string | null = null;

        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
        if (frontmatterMatch) {
          const frontmatter = frontmatterMatch[1];
          const nameMatch = frontmatter.match(/name:\s*["']?([^"'\n]+)["']?/i);
          const descMatch = frontmatter.match(/description:\s*["']?([^"'\n]+)["']?/i);
          const titleMatch = frontmatter.match(/title:\s*["']?([^"'\n]+)["']?/i);

          if (nameMatch) name = nameMatch[1].trim();
          else if (titleMatch) name = titleMatch[1].trim();
          if (descMatch) description = descMatch[1].trim();
        }

        // Remove frontmatter for storage
        const markdownContent = frontmatterMatch ? content.slice(frontmatterMatch[0].length) : content;

        upsertAgent(slug, name, description, markdownContent);
        loaded++;
        process.stdout.write('.');
      } catch (error) {
        console.error(`\nFailed to load ${file.path}:`, error instanceof Error ? error.message : error);
      }
    }));
  }
  
  console.log(`\n\nSuccessfully loaded ${loaded} agents`);
}

async function main(): Promise<void> {
  try {
    // Initialize database
    console.log('Initializing database...');
    getDb();
    console.log('Database initialized');

    // Load from GitHub
    await loadAgentsFromGitHub();

    // Verify
    const allAgents = getAllAgents();
    console.log(`\nTotal agents in database: ${allAgents.length}`);

    process.exit(0);
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

main();
