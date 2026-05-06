import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
    try {
        const { phone, password } = await req.json();

        if (!phone || !password) {
            return NextResponse.json({ error: "Phone and password required" }, { status: 400 });
        }

        // Use service role to bypass RLS for lookups
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Lookup the email associated with this phone number from the profiles table
        const { data: profiles, error: lookupError } = await supabaseAdmin
            .from("profiles")
            .select("email")
            .eq("phone", phone);

        if (lookupError || !profiles || profiles.length === 0) {
            return NextResponse.json({ error: "Invalid credentials. Please verify your email/phone and password." }, { status: 401 });
        }

        const registeredEmail = profiles[0].email;

        // 2. Verify the password by attempting a secure login on the server side
        const { error: authError } = await supabaseAdmin.auth.signInWithPassword({
            email: registeredEmail,
            password: password
        });

        if (authError) {
            return NextResponse.json({ error: "Invalid credentials. Please verify your email/phone and password." }, { status: 401 });
        }

        // 3. Success! Return the email so the client can establish its own session securely
        return NextResponse.json({ email: registeredEmail });

    } catch (error) {
        console.error("[Login Proxy] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
