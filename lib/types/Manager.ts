type League = {
  id: number;
  name: string;
  short_name?: string | null;
  created: string;
  closed: boolean;
  rank: number | null;
  max_entries: number | null;
  league_type: 's' | 'x';
  scoring: 'c';
  admin_entry: number | null;
  start_event: number;
  entry_can_leave: boolean;
  entry_can_admin: boolean;
  entry_can_invite: boolean;
  has_cup: boolean;
  rank_count: number ;
  cup_league: number | null;
  cup_qualified: boolean | null;
  entry_rank: number;
  entry_last_rank: number;
};

export type Manager = {
  id: number;
  joined_time: string;
  started_event: number;
  favourite_team: number;
  player_first_name: string;
  player_last_name: string;
  player_region_id: number;
  player_region_name: string;
  player_region_iso_code_short: string;
  player_region_iso_code_long: string;
  summary_overall_points: number;
  summary_overall_rank: number;
  summary_event_points: number;
  summary_event_rank: number;
  current_event: number;
  leagues: {
    classic: League[];
    h2h: any[]; // H2H league structure not provided in the JSON
    cup: {
      matches: any[]; // Cup matches structure not provided in the JSON
      status: {
        qualification_event: number | null;
        qualification_numbers: number | null;
        qualification_rank: number | null;
        qualification_state: string | null;
      };
      cup_league: number | null;
    };
    cup_matches: any[]; // Cup matches structure not provided in the JSON
  };
  name: string;
  name_change_blocked: boolean;
  kit: string;
  last_deadline_bank: number;
  last_deadline_value: number;
  last_deadline_total_transfers: number;
  countryImgSrc: string;
  favourite_team_badge: string;
};
