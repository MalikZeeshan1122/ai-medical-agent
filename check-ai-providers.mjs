import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cdklguvcodbzfemyyadv.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNka2xndXZjb2RiemZlbXl5YWR2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIxMTA3NiwiZXhwIjoyMDgwNzg3MDc2fQ.rQGX6DSzd_TrlL-NVhpgkSco2XTCFdH7hX6Msc6SrPs'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTable() {
  try {
    const { data, error } = await supabase
      .from('ai_providers')
      .select('*')
      .limit(1)

    if (!error) {
      console.log('✓ ai_providers table EXISTS and is accessible')
      return
    }

    if (error.code === 'PGRST116') {
      console.log('✗ ai_providers table DOES NOT EXIST')
      console.log('Error:', error.message)
      return
    }

    console.log('Error:', error)
  } catch (e) {
    console.error('Exception:', e.message)
  }
}

checkTable()
