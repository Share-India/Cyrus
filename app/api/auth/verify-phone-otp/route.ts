import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
    try {
        const { phone, otp } = await req.json()

        // Normalize phone
        let normalizedPhone = phone.replace(/[\s\-()]/g, "")
        if (/^\d{10}$/.test(normalizedPhone)) {
            normalizedPhone = `+91${normalizedPhone}`
        }
        const msg91Phone = normalizedPhone.replace('+', '')

        // Verify OTP with MSG91
        const authKey = process.env.MSG91_AUTH_KEY
        const verifyUrl = `https://api.msg91.com/api/v5/otp/verify?authkey=${authKey}&mobile=${msg91Phone}&otp=${otp}`

        const verifyResponse = await fetch(verifyUrl)
        const verifyResult = await verifyResponse.json()

        if (verifyResult.type !== 'success') {
            return NextResponse.json(
                { error: 'Invalid or expired OTP. Please try again.' },
                { status: 400 }
            )
        }

        // OTP verified — look up the user's email from profiles
        const supabase = createAdminClient()
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('email, id')
            .eq('phone', normalizedPhone)
            .maybeSingle()

        if (profileError || !profile?.email) {
            return NextResponse.json({ error: 'Account not found.' }, { status: 404 })
        }

        // Generate a one-time magic link for the user using admin privileges
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
            type: 'magiclink',
            email: profile.email,
            options: {
                redirectTo: `${siteUrl}/auth/callback`
            }
        })

        if (linkError || !linkData?.properties?.action_link) {
            console.error('[Generate Link Error]:', linkError)
            return NextResponse.json({ error: 'Failed to generate session. Please try again.' }, { status: 500 })
        }

        console.log(`[Phone OTP] Verified for ${normalizedPhone} → Signing in as ${profile.email}`)
        return NextResponse.json({
            success: true,
            actionLink: linkData.properties.action_link
        })

    } catch (err: any) {
        console.error('[Verify Phone OTP Error]:', err)
        return NextResponse.json({ error: err.message || 'Internal server error.' }, { status: 500 })
    }
}
