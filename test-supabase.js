require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
    const { data: assess, error } = await supabase.from('assessments').select('id, created_at, user_id, industry_id').order('created_at', { ascending: false }).limit(5);
    if (error) console.error("Error:", error);
    else {
        console.log("Recent Assessments:", assess);
    }
}
test();
