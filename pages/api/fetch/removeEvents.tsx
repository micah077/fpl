// pages/api/setEvent.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { log } from 'console';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { gw } = req.query; // Extract gameweek from query parameters
        const supabaseUrl: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Supabase URL or API key not provided');
        }
    
        const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

        // cheack if the request body is empty or undefined
        if (!req.body) {
            throw new Error('No data provided');
        }   
        const eventData: EventDatabase[] = req.body;

        // remove the events in eventsdata from the Events table in Supabase
        // loop through eventData and remove each event, where gw, playerId and identifier are the same as in the DB
        for (const event of eventData) {
            const { data, error } = await supabase.from('Events').delete().filter('gw', 'eq', event.gw).filter('playerId', 'eq', event.playerId).filter('identifier', 'eq', event.identifier);
            if (error) {
                throw new Error('Error deleting data in the Events table');
            }
        }
        


    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error fetching data' });
    }
}
