import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, ImageUploader, Input, PageHeader, Textarea } from '@/components/ui'
import { updateProfile } from '@/store/slices/profileSlice'
import { useAppDispatch } from '@/store/hooks'
import { useAuth, errorMessage } from '@/features/auth/AuthContext'

export function EditProfilePage() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const [form, setForm] = useState({
    firstName: user?.profile.firstName ?? '',
    lastName: user?.profile.lastName ?? '',
    bio: user?.profile.bio ?? '',
    location: user?.profile.location ?? '',
    phoneNumber: user?.profile.phoneNumber ?? '',
  })
  const [profileImageUrl, setProfileImageUrl] = useState(user?.profile.profileImageUrl ?? null)
  const [imageUploading, setImageUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!user || saving || imageUploading) return
    setSaving(true)
    setError(null)
    try {
      const updated = await dispatch(
        updateProfile({
          userId: user.user.id,
          input: {
            firstName: form.firstName.trim() || null,
            lastName: form.lastName.trim() || null,
            bio: form.bio.trim() || null,
            location: form.location.trim() || null,
            phoneNumber: form.phoneNumber.trim() || null,
            profileImageUrl: profileImageUrl || null,
          },
        }),
      ).unwrap()
      refreshProfile(updated)
      navigate('/profile', { replace: true })
    } catch (err) {
      setError(errorMessage(err))
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader title="Edit profile" subtitle="Update your public information." />
      <form onSubmit={handleSubmit}>
        <ImageUploader
          label="Profile photo"
          multiple={false}
          maxFiles={1}
          value={profileImageUrl ? [profileImageUrl] : []}
          onChange={(urls) => setProfileImageUrl(urls[0] ?? null)}
          onBusyChange={setImageUploading}
        />
        <Input
          label="First name"
          name="firstName"
          autoComplete="given-name"
          value={form.firstName}
          onChange={(e) => setField('firstName', e.target.value)}
        />
        <Input
          label="Last name"
          name="lastName"
          autoComplete="family-name"
          value={form.lastName}
          onChange={(e) => setField('lastName', e.target.value)}
        />
        <Textarea
          label="Bio"
          name="bio"
          rows={4}
          value={form.bio}
          onChange={(e) => setField('bio', e.target.value)}
        />
        <Input
          label="Location"
          name="location"
          value={form.location}
          onChange={(e) => setField('location', e.target.value)}
          placeholder="e.g. Nakuru, Kenya"
        />
        <Input
          label="Phone number"
          name="phoneNumber"
          type="tel"
          autoComplete="tel"
          value={form.phoneNumber}
          onChange={(e) => setField('phoneNumber', e.target.value)}
        />
        {error && (
          <p className="asa-form-error" role="alert">
            {error}
          </p>
        )}
        <div className="asa-profile-edit__actions">
          <Button type="submit" loading={saving} disabled={saving || imageUploading}>
            {imageUploading ? 'Waiting for photo to finish uploading…' : 'Save changes'}
          </Button>
          <Button variant="ghost" type="button" onClick={() => navigate('/profile')}>
            Cancel
          </Button>
        </div>
      </form>
    </>
  )
}