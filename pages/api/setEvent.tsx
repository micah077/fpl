// pages/api/setEvent.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient, SupabaseClient } from '@supabase/supabase-js';



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

        // add the event data from the request body
        const eventData: EventDatabase[] = req.body;

        // if eventData is empty, return empty string
        if (!eventData) {
            throw new Error('No data provided');
        }
                
        // validate that all objects in the Array has the required data is present in evnetData
        if (eventData.some(event => event.gw === null || event.playerId === null || event.identifier === null || event.value === null || event.points === null || event.fixture === null || event.minutes === null || event.totalPoints === null)) {
            throw new Error('Missing required data in eventData');
        }

        //add updatedAt to the eventData, to add when it was first updated
        const updatedAt = new Date().toISOString();
        eventData.forEach((event) => {
            event.updatedAt = updatedAt;
        }); 
        
        
        // Add the eventData to the Events table
        const { data, error } = await supabase.from('Events').insert(eventData).select();

        if (error) {
            throw new Error('Error inserting data into the Events table');
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        
        res.status(500).json({ error: 'Error fetching data' });
    }
}

