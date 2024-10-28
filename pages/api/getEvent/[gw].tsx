// pages/api/getEvent.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { gw } = req.query; // Extract gameweek from query parameters
    const supabaseUrl: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase URL or API key not proided');
    }
  
    const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);
  
    const { data, error } = await supabase.from('Events')
        .select('*')
        .filter('gw', 'eq', gw); 
console.log(data,'data')
    res.status(200).json(data);
    
  } catch (error) {
    res.status(500).json({ error: 'Error fetching data' });
  }
}

