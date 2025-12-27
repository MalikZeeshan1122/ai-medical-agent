#!/usr/bin/env node

/**
 * Create Storage Buckets in Supabase
 * Usage: node scripts/createStorageBuckets.cjs
 */

require('dotenv').config()
const https = require('https')

const projectId = 'cdklguvcodbzfemyyadv'
const supabaseUrl = `https://${projectId}.supabase.co`

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!serviceRoleKey) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY not found in environment')
  process.exit(1)
}

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(supabaseUrl + path)
    const options = {
      method,
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
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

    if (data) req.write(JSON.stringify(data))
    req.end()
  })
}

async function createBuckets() {
  console.log('🚀 Creating Supabase Storage Buckets...\n')

  // medical-documents
  console.log('📁 Creating medical-documents (private) ...')
  const medicalRes = await makeRequest('POST', '/storage/v1/bucket', {
    name: 'medical-documents',
    public: false,
  })
  if (medicalRes.status === 200 || medicalRes.status === 201) {
    console.log('✅ medical-documents created')
  } else if (medicalRes.status === 400 && medicalRes.data?.message?.includes('already exists')) {
    console.log('ℹ️  medical-documents already exists')
  } else {
    console.log('⚠️  medical-documents status:', medicalRes.status, medicalRes.data)
  }

  // user-profiles
  console.log('📁 Creating user-profiles (public) ...')
  const profileRes = await makeRequest('POST', '/storage/v1/bucket', {
    name: 'user-profiles',
    public: true,
  })
  if (profileRes.status === 200 || profileRes.status === 201) {
    console.log('✅ user-profiles created')
  } else if (profileRes.status === 400 && profileRes.data?.message?.includes('already exists')) {
    console.log('ℹ️  user-profiles already exists')
  } else {
    console.log('⚠️  user-profiles status:', profileRes.status, profileRes.data)
  }

  console.log('\n✅ Storage buckets setup complete!')
}

createBuckets().catch((err) => {
  console.error('❌ Error creating buckets:', err)
  process.exit(1)
})
