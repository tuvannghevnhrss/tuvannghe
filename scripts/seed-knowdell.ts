import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,
                              process.env.SUPABASE_SERVICE_ROLE_KEY!);

/** replace with full arrays */
const VALUES = JSON.parse(fs.readFileSync('./data/values.json','utf8'));
const SKILLS = JSON.parse(fs.readFileSync('./data/skills.json','utf8'));
const INTERESTS = JSON.parse(fs.readFileSync('./data/interests.json','utf8'));

await supabase.from('lookup_values').insert(VALUES);   // tự tạo bảng tra cứu
await supabase.from('lookup_skills').insert(SKILLS);
await supabase.from('lookup_interests').insert(INTERESTS);

console.log('✅ Seeded Knowdell decks');
