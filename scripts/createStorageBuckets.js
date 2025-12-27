#!/usr/bin/env node

/**
 * Create Storage Buckets in Supabase
 * 
 * Usage: node scripts/createStorageBuckets.js
 * 
 * Note: You need to get your SUPABASE_SERVICE_ROLE_KEY from:
 * 1. Go to https://supabase.com
 * 2. Open your project
 * 3. Settings → API → Service Role Key (under Project API keys)
 * 4. Add it to .env as SUPABASE_SERVICE_ROLE_KEY
 */

const https = require('https')

const projectId = 'cdklguvcodbzfemyyadv'
const supabaseUrl = `https://${projectId}.supabase.co`

// You need to add this to your .env file
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!serviceRoleKey) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY not found in environment')
  console.log('\nTo fix this:')
  console.log('1. Go to https://supabase.com → Your Project')
  console.log('2. Settings → API → Service Role Key')
  console.log('3. Copy the key and add to .env:')
  console.log('   SUPABASE_SERVICE_ROLE_KEY=your_key_here')
  process.exit(1)
}

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(supabaseUrl + path)
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
    }

    const req = https.request(url, options, (res) => {
      let body = ''
      res.on('data', (chunk) => (body += chunk))
      res.on('end', () => {
        try {
          const result = body ? JSON.parse(body) : {}
          resolve({ status: res.statusCode, data: result })
        } catch (e) {
          resolve({ status: res.statusCode, data: body })
        }
      })
    })

    req.on('error', reject)

    if (data) {
      req.write(JSON.stringify(data))
    }
    req.end()
  })
}

async function createBuckets() {
  console.log('🚀 Creating Supabase Storage Buckets...\n')

  try {
    // Create medical-documents bucket (private)
    console.log('📁 Creating medical-documents bucket (private)...')
    const medicalRes = await makeRequest('POST', '/storage/v1/bucket', {
      name: 'medical-documents',
      public: false,
    })

    if (medicalRes.status === 200 || medicalRes.status === 201) {
      console.log('✅ medical-documents created')
    } else if (medicalRes.status === 400 && medicalRes.data?.message?.includes('already exists')) {
      console.log('ℹ️  medical-documents already exists')
    } else {
      console.log('⚠️  Status:', medicalRes.status, medicalRes.data)
    }

    // Create user-profiles bucket (public)
    console.log('📁 Creating user-profiles bucket (public)...')
    const profileRes = await makeRequest('POST', '/storage/v1/bucket', {
      name: 'user-profiles',
      public: true,
    })

    if (profileRes.status === 200 || profileRes.status === 201) {
      console.log('✅ user-profiles created')
    } else if (profileRes.status === 400 && profileRes.data?.message?.includes('already exists')) {
      console.log('ℹ️  user-profiles already exists')
    } else {
      console.log('⚠️  Status:', profileRes.status, profileRes.data)
    }

    console.log('\n✅ Storage buckets setup complete!\n')
    console.log('Buckets created:')
    console.log('  • medical-documents (private - authenticated users only)')
    console.log('  • user-profiles (public - anyone can read)')
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

createBuckets()
