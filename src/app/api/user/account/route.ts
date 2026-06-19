import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  // profiles.id -> auth.users(id) ON DELETE CASCADE; all user content cascades
  // from profiles, so deleting the auth user permanently removes everything.
  const { error } = await admin.auth.admin.deleteUser(user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Invalidate the server-side session
  await supabase.auth.signOut()

  return NextResponse.json({ success: true })
}
