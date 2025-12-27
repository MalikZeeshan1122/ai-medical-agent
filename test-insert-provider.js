import { createClient } from '@supabase/supabase-js';

const url = 'https://cdklguvcodbzfemyyadv.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNka2xndXZjb2RiemZlbXl5YWR2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIxMTA3NiwiZXhwIjoyMDgwNzg3MDc2fQ.rQGX6DSzd_TrlL-NVhpgkSco2XTCFdH7hX6Msc6SrPs';

const supabase = createClient(url, key);

async function testInsert() {
  console.log('Testing ai_providers insert...');
  
  const { data, error } = await supabase
    .from('ai_providers')
    .insert([{
      user_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      display_name: 'Test Provider',
      provider_name: 'groq',
      model_name: 'llama-3.3-70b-versatile',
      api_key_encrypted: 'test-key-12345',
      provider_config: {}
    }]);

  if (error) {
    console.error('❌ Insert failed:');
    console.error('  Code:', error.code);
    console.error('  Message:', error.message);
    console.error('  Details:', error.details);
    console.error('  Hint:', error.hint);
  } else {
    console.log('✅ Insert succeeded:', data);
  }
}

testInsert();
