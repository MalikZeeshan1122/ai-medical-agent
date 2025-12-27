import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cdklguvcodbzfemyyadv.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY not found in environment variables')
  console.log('Please add SUPABASE_SERVICE_ROLE_KEY to your .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createBuckets() {
  try {
    // Create medical-documents bucket
    console.log('Creating medical-documents bucket...')
    const { data: medicalData, error: medicalError } = await supabase.storage.createBucket('medical-documents', {
      public: false,
    })

    if (medicalError && !medicalError.message.includes('already exists')) {
      throw new Error(`Failed to create medical-documents: ${medicalError.message}`)
    }
    console.log('✅ medical-documents bucket created/exists')

    // Create user-profiles bucket
    console.log('Creating user-profiles bucket...')
    const { data: profileData, error: profileError } = await supabase.storage.createBucket('user-profiles', {
      public: true,
    })

    if (profileError && !profileError.message.includes('already exists')) {
      throw new Error(`Failed to create user-profiles: ${profileError.message}`)
    }
    console.log('✅ user-profiles bucket created/exists')

    // Set bucket policies
    console.log('Configuring bucket policies...')

    // Medical documents - private access
    const { error: medicalPolicyError } = await supabase.rpc('create_bucket_policy', {
      bucket_name: 'medical-documents',
      policy_name: 'Private access for authenticated users',
      definition: `
        ALTER POLICY "Enable insert for authenticated users only on medical-documents"
        ON storage.objects FOR INSERT
        WITH CHECK (bucket_id = 'medical-documents' AND auth.role() = 'authenticated');
      `,
    }).then(() => ({ error: null })).catch(err => ({ error: err }))

    // User profiles - public read
    const { error: profilePolicyError } = await supabase.rpc('create_bucket_policy', {
      bucket_name: 'user-profiles',
      policy_name: 'Public read access',
      definition: `
        ALTER POLICY "Enable public read on user-profiles"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'user-profiles');
      `,
    }).then(() => ({ error: null })).catch(err => ({ error: err }))

    console.log('✅ Bucket policies configured')
    console.log('\n✅ All storage buckets created successfully!')
    console.log('\nBuckets:')
    console.log('  • medical-documents (private)')
    console.log('  • user-profiles (public)')
  } catch (error) {
    console.error('Error creating buckets:', error)
    process.exit(1)
  }
}

createBuckets()
