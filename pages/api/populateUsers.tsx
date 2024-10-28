// pages/api/getData.ts

// pages/api/getData.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { log } from 'console';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  


  try {
    const supabaseUrl: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;


    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL or API key not proided');
    }

    const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);
    // Your data fetching logic using Supabase
    
    // get the user from the Users table with the highest user_id
    const { data, error } = await supabase.from('Users').select('*').order('user_id', { ascending: false }).limit(1);
    if (error) {
      throw new Error('Error fetching data from the Users table');
    }
    const userDataFromDB: UserDatabase = data;
  
    // loop through for data.user_id to 1000, and fetch the user data from the FPL API
    // then insert the data into the Users table
    for (let i = userDataFromDB[0].user_id + 1; i < 10800000; i++) {
    

      const userdataPromise = await fetch(`https://fantasy.premierleague.com/api/entry/${i}/`, { cache: 'no-store' });
      const userdata = await userdataPromise.json();
      
      const objectToBeInserted = [{
        user_id: userdata.id,
        name: userdata.name,
        favourite_team: userdata.favourite_team,
        player_first_name: userdata.player_first_name,
        player_last_name: userdata.player_last_name,
        player_region_id: userdata.player_region_id,
        player_region_name: userdata.player_region_name,
        player_region_iso_code_short: userdata.player_region_iso_code_short,
        player_region_iso_code_long: userdata.player_region_iso_code_long
      }];

      // add objectToBeInserted to the Users table in the database. If the user_id already exists, update the data
      const { data, error } = await supabase.from('Users').upsert(objectToBeInserted).select();
      if (error) {
        throw new Error('Error inserting data into the Users table');
      }

    
    }


    res.status(200).json({ data: 'Data fetched successfully' });

  } catch (error) {

    
    
    res.status(500).json({ error: 'Error fetching data' });
  }
  
  
}

