import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
    try {
        const { phone } = await req.json()

        // Normalize phone to E.164 format
        let normalizedPhone = phone.replace(/[\s\-()]/g, "")
        if (/^\d{10}$/.test(normalizedPhone)) {
            normalizedPhone = `+91${normalizedPhone}`
        }

        const supabase = createAdminClient()

        // Check if a user with this phone exists in our profiles (whitelist check)
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('email, id')
            .eq('phone', normalizedPhone)
            .maybeSingle()

        if (profileError || !profile) {
            return NextResponse.json(
                { error: 'No registered account found with this phone number. Please sign up first.' },
                { status: 404 }
            )
        }

        // Send OTP via MSG91
        const authKey = process.env.MSG91_AUTH_KEY
        const templateId = process.env.MSG91_TEMPLATE_ID
        // Strip leading '+' for MSG91 (it expects country code without +)
        const msg91Phone = normalizedPhone.replace('+', '')

        const msg91Url = `https://api.msg91.com/api/v5/otp?authkey=${authKey}&mobile=${msg91Phone}&template_id=${templateId}`

        const msg91Response = await fetch(msg91Url, { method: 'POST' })
        const msg91Result = await msg91Response.json()

        if (msg91Result.type === 'error') {
            console.error('[MSG91 Send Error]:', msg91Result)
            return NextResponse.json({ error: msg91Result.message || 'Failed to send OTP.' }, { status: 400 })
        }

        console.log(`[Phone OTP] Sent to ${normalizedPhone} for account: ${profile.email}`)
        return NextResponse.json({ success: true })

    } catch (err: any) {
        console.error('[Send Phone OTP Error]:', err)
        return NextResponse.json({ error: err.message || 'Internal server error.' }, { status: 500 })
    }
}
