import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function checkProfile() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const phoneToCheck = "9137307950";
    const normalizedWith91 = `+91${phoneToCheck}`;
    
    console.log(`Checking for phone: ${phoneToCheck} and ${normalizedWith91}`);

    const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .or(`phone.eq.${phoneToCheck},phone.eq.${normalizedWith91},phone.eq.+91${phoneToCheck}`);

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log(`Found ${profiles.length} profiles:`);
    profiles.forEach(p => console.log(`- ID: ${p.id}, Email: ${p.email}, Phone: ${p.phone}`));
}

checkProfile();
