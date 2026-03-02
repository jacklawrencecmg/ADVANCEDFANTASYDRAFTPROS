/*
  # Fix Ashton Jeanty Sleeper ID in player_values_canonical

  ## Problem
  Ashton Jeanty (RB, LV) has player_id '11572' in player_values_canonical.
  This was a guessed sequential ID from the dynasty value seeding migrations.

  His actual Sleeper API ID is '12527' (verified: Sleeper API returns
  {"id":"12527","name":"Ashton Jeanty","position":"RB","team":"LV",...}).

  Because the TradeAnalyzer resolves players via the Sleeper API (which returns id '12527')
  and then looks up playerValues['12527'], but canonical only has him at '11572',
  the lookup fails and shows value 0.

  ## Fix
  Update player_values_canonical to use his real Sleeper ID '12527'.
  latest_player_values is a view on player_values_canonical so the fix propagates
  automatically.
*/

UPDATE player_values_canonical
SET player_id = '12527'
WHERE player_name = 'Ashton Jeanty'
  AND format = 'dynasty';
