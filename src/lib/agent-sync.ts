// =====================================================
// Agent Sync - OpenClaw & Workspace Synchronization
// Phase 2 Enhanced
// =====================================================

import fs from 'fs';
import path from 'path';
import db from './db';
import { createChildLogger } from './logger';
import { generateId, slugify } from './utils';
import type { Agent, AgentDivision, AgentSource } from '@/types';

const logger = createChildLogger('agent-sync');

interface OpenClawAgent {
  id: string;
  name: string;
  workspace?: string;
  model?: {
    primary?: string;
    fallbacks?: string[];
  };
  identity?: {
    name?: string;
    theme?: string;
    emoji?: string;
  };
}

interface OpenClawConfig {
  agents?: OpenClawAgent[];
}

/**
 * Sync agents from OpenClaw configuration
 */
export async function syncFromOpenClaw(configPath?: string): Promise<number> {
  const openclawConfigPath =
    configPath ||
    process.env.OPENCLAW_CONFIG_PATH ||
    path.join(process.env.HOME || '', '.openclaw', 'openclaw.json');

  if (!fs.existsSync(openclawConfigPath)) {
    logger.warn({ path: openclawConfigPath }, 'OpenClaw config not found');
    return 0;
  }

  try {
    const config = JSON.parse(
      fs.readFileSync(openclawConfigPath, 'utf-8')
    ) as OpenClawConfig;

    if (!config.agents || config.agents.length === 0) {
      logger.info('No agents in OpenClaw config');
      return 0;
    }

    let synced = 0;

    for (const agent of config.agents) {
      const result = upsertAgent(agent);
      if (result) synced++;
    }

    logger.info({ count: synced }, 'Agents synced from OpenClaw');
    return synced;
  } catch (error) {
    logger.error({ error }, 'Failed to sync from OpenClaw');
    throw error;
  }
}

/**
 * Sync agents from workspace soul.md files
 */
export async function syncFromWorkspace(workspacePath?: string): Promise<number> {
  const agentsDir =
    workspacePath || path.join(process.cwd(), 'workspace', 'agents');

  if (!fs.existsSync(agentsDir)) {
    logger.warn({ path: agentsDir }, 'Workspace agents directory not found');
    return 0;
  }

  let synced = 0;
  const agentDirs = fs.readdirSync(agentsDir);

  for (const agentSlug of agentDirs) {
    const soulPath = path.join(agentsDir, agentSlug, 'soul.md');

    if (!fs.existsSync(soulPath)) {
      continue;
    }

    try {
      const soulContent = fs.readFileSync(soulPath, 'utf-8');
      const agent = parseSoulFile(agentSlug, soulContent);

      if (agent) {
        upsertAgentFromSoul(agent);
        synced++;
      }
    } catch (error) {
      logger.error({ agentSlug, error }, 'Failed to parse soul.md');
    }
  }

  logger.info({ count: synced }, 'Agents synced from workspace');
  return synced;
}

/**
 * Parse soul.md file to agent data with Phase 2 fields
 */
function parseSoulFile(
  slug: string,
  content: string
): Partial<Agent> | null {
  // Parse YAML frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

  if (!frontmatterMatch) {
    return null;
  }

  const frontmatter = frontmatterMatch[1];
  const data: Record<string, string> = {};

  // Simple YAML parsing with quoted values support
  for (const line of frontmatter.split('\n')) {
    const match = line.match(/^(\w+):\s*"?([^"]*)"?$/);
    if (match) {
      data[match[1]] = match[2].trim();
    }
  }

  // Extract division from description, path, or explicit field
  let division: AgentDivision = data.division as AgentDivision || 'engineering';
  const description = data.description?.toLowerCase() || '';
  
  if (!data.division) {
    if (description.includes('ceo') || description.includes('strategic') || description.includes('executive')) {
      division = 'executive';
    } else if (description.includes('marketing')) {
      division = 'marketing';
    } else if (description.includes('sales') || description.includes('revenue')) {
      division = 'sales';
    } else if (description.includes('operations')) {
      division = 'operations';
    } else if (description.includes('design') || description.includes('ui') || description.includes('ux')) {
      division = 'design';
    } else if (description.includes('test') || description.includes('qa')) {
      division = 'testing';
    } else if (description.includes('support')) {
      division = 'support';
    } else if (description.includes('product')) {
      division = 'product';
    }
  }

  // Determine source
  const source: AgentSource = data.source as AgentSource || 'local';

  return {
    slug,
    name: data.name || slug,
    description: data.description || '',
    emoji: data.emoji || '🤖',
    color: data.color || 'blue',
    division,
    specialization: data.specialization,
    source,
    sourceUrl: data.source_url,
    systemPrompt: content,
    capabilities: extractCapabilities(content),
    technicalSkills: extractTechnicalSkills(content),
    personalityTraits: extractPersonalityTraits(content),
  };
}

/**
 * Extract capabilities from soul.md content
 */
function extractCapabilities(content: string): string[] {
  const capabilities: string[] = [];

  // Look for capability-related patterns
  const patterns = [
    /capabilities?:?\s*([\w,\s-]+)/gi,
    /specializ\w+\s+in\s+([\w,\s-]+)/gi,
    /expert\w*\s+in\s+([\w,\s-]+)/gi,
    /##\s*(?:Core\s+)?Capabilities\n([\s\S]*?)(?=\n##|\n$)/gi,
  ];

  for (const pattern of patterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const caps = match[1].split(/[,\n]/).map((c) => c.trim().replace(/^[-*]\s*/, ''));
      capabilities.push(...caps.filter((c) => c.length > 2 && c.length < 50));
    }
  }

  // Deduplicate
  return [...new Set(capabilities)].slice(0, 20);
}

/**
 * Extract technical skills from content
 */
function extractTechnicalSkills(content: string): string[] {
  const skills: string[] = [];
  
  const techKeywords = [
    'react', 'vue', 'angular', 'typescript', 'javascript', 'python', 'go', 'rust',
    'nodejs', 'docker', 'kubernetes', 'aws', 'gcp', 'azure', 'terraform',
    'graphql', 'rest', 'api', 'sql', 'nosql', 'mongodb', 'postgresql', 'redis',
    'figma', 'tailwind', 'css', 'html', 'git', 'ci/cd',
  ];

  const contentLower = content.toLowerCase();
  for (const keyword of techKeywords) {
    if (contentLower.includes(keyword)) {
      skills.push(keyword);
    }
  }

  return [...new Set(skills)];
}

/**
 * Extract personality traits from content
 */
function extractPersonalityTraits(content: string): string[] {
  const traits: string[] = [];
  
  const commonTraits = [
    'analytical', 'creative', 'detail-oriented', 'systematic', 'collaborative',
    'innovative', 'pragmatic', 'thorough', 'efficient', 'proactive',
    'visionary', 'decisive', 'strategic', 'empathetic', 'articulate',
  ];

  const contentLower = content.toLowerCase();
  for (const trait of commonTraits) {
    if (contentLower.includes(trait)) {
      traits.push(trait);
    }
  }

  return [...new Set(traits)];
}

/**
 * Upsert agent from OpenClaw config
 */
function upsertAgent(openclawAgent: OpenClawAgent): boolean {
  const slug = slugify(openclawAgent.name || openclawAgent.id);

  const existing = db
    .prepare('SELECT id FROM agents WHERE slug = ?')
    .get(slug) as { id: string } | undefined;

  if (existing) {
    const stmt = db.prepare(`
      UPDATE agents SET
        name = ?,
        workspace_path = ?,
        model_config = ?,
        source = 'openclaw',
        updated_at = datetime('now')
      WHERE slug = ?
    `);

    stmt.run(
      openclawAgent.name,
      openclawAgent.workspace || null,
      JSON.stringify({
        primary: openclawAgent.model?.primary || 'claude-3-opus',
        fallbacks: openclawAgent.model?.fallbacks || [],
      }),
      slug
    );
  } else {
    const stmt = db.prepare(`
      INSERT INTO agents (
        id, name, slug, description, emoji, color, division,
        source, status, capabilities, technical_skills, personality_traits,
        system_prompt, workspace_path, model_config, metrics
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      generateId(),
      openclawAgent.name,
      slug,
      `AI agent: ${openclawAgent.name}`,
      openclawAgent.identity?.emoji || '🤖',
      openclawAgent.identity?.theme || 'blue',
      'engineering',
      'openclaw',
      'idle',
      '[]',
      '[]',
      '[]',
      '',
      openclawAgent.workspace || null,
      JSON.stringify({
        primary: openclawAgent.model?.primary || 'claude-3-opus',
        fallbacks: openclawAgent.model?.fallbacks || [],
      }),
      JSON.stringify({ tasksCompleted: 0, successRate: 0, avgResponseTime: 0 })
    );
  }

  return true;
}

/**
 * Upsert agent from soul.md data with Phase 2 fields
 */
function upsertAgentFromSoul(agent: Partial<Agent>): boolean {
  const slug = agent.slug || slugify(agent.name || 'unknown');

  const existing = db
    .prepare('SELECT id FROM agents WHERE slug = ?')
    .get(slug) as { id: string } | undefined;

  if (existing) {
    const stmt = db.prepare(`
      UPDATE agents SET
        name = ?,
        description = ?,
        emoji = ?,
        color = ?,
        division = ?,
        specialization = ?,
        source = ?,
        source_url = ?,
        capabilities = ?,
        technical_skills = ?,
        personality_traits = ?,
        system_prompt = ?,
        updated_at = datetime('now')
      WHERE slug = ?
    `);

    stmt.run(
      agent.name,
      agent.description,
      agent.emoji,
      agent.color,
      agent.division,
      agent.specialization || null,
      agent.source || 'local',
      agent.sourceUrl || null,
      JSON.stringify(agent.capabilities || []),
      JSON.stringify(agent.technicalSkills || []),
      JSON.stringify(agent.personalityTraits || []),
      agent.systemPrompt,
      slug
    );
  } else {
    const stmt = db.prepare(`
      INSERT INTO agents (
        id, name, slug, description, emoji, color, division, specialization,
        source, source_url, status, capabilities, technical_skills, personality_traits,
        system_prompt, model_config, metrics
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      generateId(),
      agent.name,
      slug,
      agent.description,
      agent.emoji,
      agent.color,
      agent.division,
      agent.specialization || null,
      agent.source || 'local',
      agent.sourceUrl || null,
      'idle',
      JSON.stringify(agent.capabilities || []),
      JSON.stringify(agent.technicalSkills || []),
      JSON.stringify(agent.personalityTraits || []),
      agent.systemPrompt,
      JSON.stringify({ primary: 'claude-3-opus', fallbacks: [] }),
      JSON.stringify({ tasksCompleted: 0, successRate: 0, avgResponseTime: 0 })
    );
  }

  return true;
}

/**
 * Full sync from all sources
 */
export async function syncAll(): Promise<{ openclaw: number; workspace: number }> {
  const openclaw = await syncFromOpenClaw();
  const workspace = await syncFromWorkspace();

  return { openclaw, workspace };
}

/**
 * Get agent count by source
 */
export function getAgentCountBySource(): Record<string, number> {
  const stmt = db.prepare(`
    SELECT source, COUNT(*) as count FROM agents GROUP BY source
  `);
  const rows = stmt.all() as Array<{ source: string; count: number }>;
  
  return rows.reduce((acc, row) => {
    acc[row.source || 'local'] = row.count;
    return acc;
  }, {} as Record<string, number>);
}

/**
 * Get agent count by division
 */
export function getAgentCountByDivision(): Record<string, number> {
  const stmt = db.prepare(`
    SELECT division, COUNT(*) as count FROM agents GROUP BY division
  `);
  const rows = stmt.all() as Array<{ division: string; count: number }>;
  
  return rows.reduce((acc, row) => {
    acc[row.division] = row.count;
    return acc;
  }, {} as Record<string, number>);
}
