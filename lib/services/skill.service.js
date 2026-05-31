import { supabase } from '@/lib/supabase';
import { cacheFetch, cacheGet, cacheSet } from '@/lib/cache';

const TTL = { skills: 10 * 60 * 1000 };

export async function getSkills() {
  return cacheFetch('skills:all', TTL.skills, async () => {
    const { data, error } = await supabase.from('skills').select('id, name, category').order('category').order('name');
    if (error) {
      console.error('getSkills error:', error.message, '— Have you run supabase/schema.sql?');
      return [];
    }
    return data || [];
  });
}

export async function getSkillsByIds(ids) {
  if (!ids?.length) return [];
  const all = await getSkills();
  const set = new Set(ids);
  return all.filter(s => set.has(s.id));
}

export async function getSkillById(id) {
  const hit = cacheGet(`skill:${id}`);
  if (hit) return hit;
  const { data } = await supabase.from('skills').select('*').eq('id', id).single();
  if (data) cacheSet(`skill:${id}`, data, TTL.skills);
  return data || null;
}
