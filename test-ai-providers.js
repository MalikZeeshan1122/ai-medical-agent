import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cdklguvcodbzfemyyadv.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNka2xndXZjb2RiemZlbXl5YWR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMTEwNzYsImV4cCI6MjA4MDc4NzA3Nn0.8t89IqW7lMU5q-KJ6rKbM7N9qJjPiVTCfCYG2lJxVw0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAIProviders() {
  try {
    const { data, error } = await supabase
      .from('ai_providers')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('Table does not exist or error:', error.message)
      return false
    }
    
    console.log('✓ ai_providers table exists and is accessible')
    console.log('Data:', data)
    return true
  } catch (e) {
    console.error('Error:', e.message)
    return false
  }
}

testAIProviders()
