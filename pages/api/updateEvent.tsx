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

        // add updatedAt to the eventData
        eventData.forEach(event => {
            event.updatedAt = new Date();
        });
        
        if (!eventData) {
            throw new Error('eventData is Empty');
        }

        // validate that all objects in the Array has the required data is present in evnetData
        if (eventData.some(event => event.gw === null || event.playerId === null || event.identifier === null || event.value === null || event.points === null || event.fixture === null || event.minutes === null || event.totalPoints === null)) {
            throw new Error('Missing required data in eventData');
        }

        //update the eventData in the Events table, where gw, playerId and identifier are the same
        // loop through eventData and update each event, where gw, playerId and identifier are the same as in the DB
        for (const event of eventData) {
            const { data, error } = await supabase.from('Events').update(event).filter('gw', 'eq', event.gw).filter('playerId', 'eq', event.playerId).filter('identifier', 'eq', event.identifier);
            if (error) {
                throw new Error('Error updating data in the Events table');
            }
        }
        

        res.status(200).json({ success: true });  
    } catch (error) {
        console.error('Error:', error);
        
        res.status(500).json({ error: 'Error fetching data' });
    }
}

