export interface PoBAutoSubs {
    userId:        number;
    pointsOnBench: PointsOnBench[];
    autoSubs:      AutoSub[];
    entry_name:     string;
    player_name:    string;

}

export interface AutoSub {
    elementIn:  PointsOnBench;
    elementOut: PointsOnBench;
}

export interface PointsOnBench {
    element:         number;
    position:        number;
    multiplier:      number;
    is_captain:      boolean;
    is_vice_captain: boolean;
    elementData:     ElementData;
    elementGWdata:   ElementGWdata;
}

export interface ElementData {
    chance_of_playing_next_round:         number | null;
    chance_of_playing_this_round:         number | null;
    code:                                 number;
    cost_change_event:                    number;
    cost_change_event_fall:               number;
    cost_change_start:                    number;
    cost_change_start_fall:               number;
    dreamteam_count:                      number;
    element_type:                         number;
    ep_next:                              string;
    ep_this:                              string;
    event_points:                         number;
    first_name:                           string;
    form:                                 string;
    id:                                   number;
    in_dreamteam:                         boolean;
    news:                                 News;
    news_added:                           Date | null;
    now_cost:                             number;
    photo:                                string;
    points_per_game:                      string;
    second_name:                          string;
    selected_by_percent:                  string;
    special:                              boolean;
    squad_number:                         null;
    status:                               Status;
    team:                                 number;
    team_code:                            number;
    total_points:                         number;
    transfers_in:                         number;
    transfers_in_event:                   number;
    transfers_out:                        number;
    transfers_out_event:                  number;
    value_form:                           string;
    value_season:                         string;
    web_name:                             string;
    minutes:                              number;
    goals_scored:                         number;
    assists:                              number;
    clean_sheets:                         number;
    goals_conceded:                       number;
    own_goals:                            number;
    penalties_saved:                      number;
    penalties_missed:                     number;
    yellow_cards:                         number;
    red_cards:                            number;
    saves:                                number;
    bonus:                                number;
    bps:                                  number;
    influence:                            string;
    creativity:                           string;
    threat:                               string;
    ict_index:                            string;
    starts:                               number;
    expected_goals:                       string;
    expected_assists:                     string;
    expected_goal_involvements:           string;
    expected_goals_conceded:              string;
    influence_rank:                       number;
    influence_rank_type:                  number;
    creativity_rank:                      number;
    creativity_rank_type:                 number;
    threat_rank:                          number;
    threat_rank_type:                     number;
    ict_index_rank:                       number;
    ict_index_rank_type:                  number;
    corners_and_indirect_freekicks_order: number | null;
    corners_and_indirect_freekicks_text:  string;
    direct_freekicks_order:               number | null;
    direct_freekicks_text:                string;
    penalties_order:                      number | null;
    penalties_text:                       string;
    expected_goals_per_90:                number;
    saves_per_90:                         number;
    expected_assists_per_90:              number;
    expected_goal_involvements_per_90:    number;
    expected_goals_conceded_per_90:       number;
    goals_conceded_per_90:                number;
    now_cost_rank:                        number;
    now_cost_rank_type:                   number;
    form_rank:                            number;
    form_rank_type:                       number;
    points_per_game_rank:                 number;
    points_per_game_rank_type:            number;
    selected_rank:                        number;
    selected_rank_type:                   number;
    starts_per_90:                        number;
    clean_sheets_per_90:                  number;
}

export enum News {
    Empty = "",
    LoanedToSevilla = "Loaned to Sevilla",
    LoanedToStokeCity = "Loaned to Stoke City",
    LoanedToZulteWaregem = "Loaned to Zulte Waregem",
}

export enum Status {
    A = "a",
    U = "u",
}

export interface ElementGWdata {
    element:                    number;
    fixture:                    number;
    opponent_team:              number;
    total_points:               number;
    was_home:                   boolean;
    kickoff_time:               Date;
    team_h_score:               number;
    team_a_score:               number;
    round:                      number;
    minutes:                    number;
    goals_scored:               number;
    assists:                    number;
    clean_sheets:               number;
    goals_conceded:             number;
    own_goals:                  number;
    penalties_saved:            number;
    penalties_missed:           number;
    yellow_cards:               number;
    red_cards:                  number;
    saves:                      number;
    bonus:                      number;
    bps:                        number;
    influence:                  string;
    creativity:                 string;
    threat:                     string;
    ict_index:                  string;
    starts:                     number;
    expected_goals:             string;
    expected_assists:           string;
    expected_goal_involvements: string;
    expected_goals_conceded:    string;
    value:                      number;
    transfers_balance:          number;
    selected:                   number;
    transfers_in:               number;
    transfers_out:              number;
}
