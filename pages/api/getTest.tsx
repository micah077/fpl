// pages/api/getData.ts

// pages/api/getData.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface TestData {
  id: number;
  date: Date;
  name: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabaseUrl: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;


    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL or API key not proided');
    }

    const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);
    
    // Your data fetching logic using Supabase
    
    const { data, error } = await supabase.from('Test').select('*');
    
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching data' });
  }
}

