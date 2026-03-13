

## Profile Photo Upload & Display

### What needs to happen

1. **Create a Supabase storage bucket** (`avatars`) for profile photos
2. **Profile Page**: Replace the static initial circle with a working photo upload — click to select file, preview, upload to Supabase Storage, save URL to `profiles.avatar`
3. **Dashboard Page**: Show the user's avatar in the header greeting area
4. **Sidebar**: Show a small avatar next to the logout area

### Technical details

**Database/Storage (migration):**
- Create a public `avatars` bucket in Supabase Storage
- Add RLS policies: authenticated users can upload/update/delete their own files (path pattern: `{user_id}/*`), public read access

**File: `src/pages/ProfilePage.tsx`**
- Add a hidden `<input type="file" accept="image/*">` triggered by the "Alterar foto" button
- On file select: upload to `avatars/{user_id}/avatar.{ext}` via `supabase.storage.from('avatars').upload()`
- Get the public URL and call `updateProfile({ avatar: publicUrl })`
- Show the current avatar image (from `profile.avatar`) or fallback to the initial letter
- Add a loading state during upload

**File: `src/pages/DashboardPage.tsx`**
- In the PageHeader greeting area, add an Avatar component showing `profile.avatar` with fallback to user initial

**File: `src/components/layout/AppSidebar.tsx`**
- In the bottom section near the logout button, show a small avatar (32px) with the user's photo or initial

**Components used:** Existing `Avatar`, `AvatarImage`, `AvatarFallback` from `@/components/ui/avatar.tsx`

