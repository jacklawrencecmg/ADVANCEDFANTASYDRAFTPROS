/*
  # Fix Comprehensive Player Values — 2026 Dynasty Consensus

  ## Key Corrections
  - Lamar Jackson: 8800 → 9200 (best dynasty QB)
  - Jayden Daniels: 7600 → 8200 (elite rookie year, top-5 dynasty QB)
  - J.J. McCarthy: 6600 → 5000 (missed entire rookie year with injury)
  - Patrick Mahomes: 9500 → 7200 (getting older, dynasty value declining)
  - Josh Allen: 9300 → 8200 (great but aging)
  - Justin Herbert: 6200 → 7500 (should be higher, elite arm/team)
  - Chase Brown: 800 → 4800 (CIN lead RB after Mixon left — MASSIVE undervalue)
  - Bucky Irving: 2400 → 4800 (now TB starter, took Rachaad White's job)
  - Rachaad White: 4800 → 900 (lost starting job to Bucky Irving)
  - Saquon Barkley: 5200 → 4500 (29yo, aging in dynasty)
  - Puka Nacua: 8400 → 6800 (had a down year 2, but still elite prospect)
  - Amon-Ra St. Brown: 8600 → 7000 (good WR1, getting older)
  - Malik Nabers: 3200 → 7800 (WAY too low — elite year-2 WR)
  - Marvin Harrison Jr.: 4800 → 7500 (WAY too low — elite year-2 WR)
  - Brian Thomas Jr.: 4600 → 7200 (WAY too low — elite year-2 WR)
  - Ladd McConkey: 3600 → 7200 (WAY too low — breakout season)
  - Xavier Worthy: 3900 → 5800 (KC WR1, great situation with Mahomes)
  - Rome Odunze: 3400 → 5800 (CHI WR1, ascending)
  - Keon Coleman: 2800 → 5500 (BUF WR2, excellent QB)
  - Tank Dell: 2600 → 4800 (HOU WR2, coming back from injury)
  - Josh Downs: 2000 → 3800 (IND WR2, solid PPR value)
  - Jahan Dotson: 600 → 4500 (PHI WR2, great situation)
  - Jerry Jeudy: 4200 → 3500 (CLE WR1 but bad QB situation)
  - Davante Adams: not corrected previously — aging WR, ~2500
  - Zay Flowers + Nico Collins + Jordan Addison: added (were in DB but not corrected)
  - Trey McBride: 6200 → 7500 (ascending elite TE, should be TE2)
  - Colston Loveland: 4400 → 5500 (top 2025 TE pick, CHI)
  - Tyler Warren: 4000 → 5200 (top 2025 TE pick, IND)

  All values are half-PPR dynasty consensus as of early 2026.
  Uses player_name in WHERE to avoid player_id confusion.
*/

-- ============================================================
-- QBs
-- ============================================================
-- Lamar is the #1 dynasty QB going into 2026 (elite dual threat, prime age)
UPDATE player_values_canonical SET adjusted_value = 9200, base_value = 9200 WHERE player_name = 'Lamar Jackson'       AND format = 'dynasty';
-- Hurts elite dual threat but injury concerns
UPDATE player_values_canonical SET adjusted_value = 8500, base_value = 8500 WHERE player_name = 'Jalen Hurts'         AND format = 'dynasty';
-- Daniels had an elite rookie year, top-5 dynasty QB
UPDATE player_values_canonical SET adjusted_value = 8200, base_value = 8200 WHERE player_name = 'Jayden Daniels'      AND format = 'dynasty';
-- Allen great but getting older
UPDATE player_values_canonical SET adjusted_value = 8200, base_value = 8200 WHERE player_name = 'Josh Allen'          AND format = 'dynasty';
-- Burrow elite talent, injury history
UPDATE player_values_canonical SET adjusted_value = 7800, base_value = 7800 WHERE player_name = 'Joe Burrow'          AND format = 'dynasty';
-- Stroud young elite QB, HOU offense is stacked
UPDATE player_values_canonical SET adjusted_value = 7800, base_value = 7800 WHERE player_name = 'C.J. Stroud'         AND format = 'dynasty';
-- Herbert elite arm, LAC improved
UPDATE player_values_canonical SET adjusted_value = 7500, base_value = 7500 WHERE player_name = 'Justin Herbert'      AND format = 'dynasty';
-- Mahomes getting older (31 in 2026), still elite
UPDATE player_values_canonical SET adjusted_value = 7200, base_value = 7200 WHERE player_name = 'Patrick Mahomes'     AND format = 'dynasty';
-- Caleb Williams disappointing rookie year but still young (CHI)
UPDATE player_values_canonical SET adjusted_value = 6800, base_value = 6800 WHERE player_name = 'Caleb Williams'      AND format = 'dynasty';
-- Maye solid rookie year with NE
UPDATE player_values_canonical SET adjusted_value = 6500, base_value = 6500 WHERE player_name = 'Drake Maye'          AND format = 'dynasty';
-- J.J. McCarthy missed ENTIRE rookie year with torn meniscus — high upside still
UPDATE player_values_canonical SET adjusted_value = 5000, base_value = 5000 WHERE player_name = 'J.J. McCarthy'       AND format = 'dynasty';
-- Murray ARI offense built around him
UPDATE player_values_canonical SET adjusted_value = 5200, base_value = 5200 WHERE player_name = 'Kyler Murray'        AND format = 'dynasty';
-- Tua injury concerns but good when healthy
UPDATE player_values_canonical SET adjusted_value = 4800, base_value = 4800 WHERE player_name = 'Tua Tagovailoa'      AND format = 'dynasty';
-- Nix solid starter, DEN
UPDATE player_values_canonical SET adjusted_value = 5000, base_value = 5000 WHERE player_name = 'Bo Nix'              AND format = 'dynasty';
-- Love GB offense, solid
UPDATE player_values_canonical SET adjusted_value = 4500, base_value = 4500 WHERE player_name = 'Jordan Love'         AND format = 'dynasty';
-- Lawrence JAX rebuilding, still young
UPDATE player_values_canonical SET adjusted_value = 4000, base_value = 4000 WHERE player_name = 'Trevor Lawrence'     AND format = 'dynasty';
-- Richardson injury history, IND
UPDATE player_values_canonical SET adjusted_value = 4000, base_value = 4000 WHERE player_name = 'Anthony Richardson'  AND format = 'dynasty';
-- Goff DET, solid but aging
UPDATE player_values_canonical SET adjusted_value = 3500, base_value = 3500 WHERE player_name = 'Jared Goff'          AND format = 'dynasty';
-- Shedeur Sanders CLE 2025 #1 pick, good prospect
UPDATE player_values_canonical SET adjusted_value = 3500, base_value = 3500 WHERE player_name = 'Shedeur Sanders'     AND format = 'dynasty';
-- Cam Ward TEN 2025 rookie QB
UPDATE player_values_canonical SET adjusted_value = 3200, base_value = 3200 WHERE player_name = 'Cam Ward'            AND format = 'dynasty';
-- Purdy SF system QB, solid starter
UPDATE player_values_canonical SET adjusted_value = 3200, base_value = 3200 WHERE player_name = 'Brock Purdy'         AND format = 'dynasty';
-- Prescott DAL, coming off injury
UPDATE player_values_canonical SET adjusted_value = 2500, base_value = 2500 WHERE player_name = 'Dak Prescott'        AND format = 'dynasty';
-- Mayfield TB, solid starter
UPDATE player_values_canonical SET adjusted_value = 2500, base_value = 2500 WHERE player_name = 'Baker Mayfield'      AND format = 'dynasty';
-- Fields PIT, backup
UPDATE player_values_canonical SET adjusted_value = 1800, base_value = 1800 WHERE player_name = 'Justin Fields'       AND format = 'dynasty';
-- Darnold journeyman
UPDATE player_values_canonical SET adjusted_value = 1200, base_value = 1200 WHERE player_name = 'Sam Darnold'         AND format = 'dynasty';
-- Bryce Young CAR, backup
UPDATE player_values_canonical SET adjusted_value = 1000, base_value = 1000 WHERE player_name = 'Bryce Young'         AND format = 'dynasty';
-- Aging/backup QBs
UPDATE player_values_canonical SET adjusted_value = 500, base_value = 500   WHERE player_name = 'Kirk Cousins'        AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 500, base_value = 500   WHERE player_name = 'Geno Smith'          AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 300, base_value = 300   WHERE player_name = 'Daniel Jones'        AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 200, base_value = 200   WHERE player_name = 'Aaron Rodgers'       AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 200, base_value = 200   WHERE player_name = 'Russell Wilson'      AND format = 'dynasty';

-- ============================================================
-- RBs
-- ============================================================
-- Elite tier RBs
UPDATE player_values_canonical SET adjusted_value = 8500, base_value = 8500 WHERE player_name = 'Bijan Robinson'       AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 8000, base_value = 8000 WHERE player_name = 'Breece Hall'          AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 8000, base_value = 8000 WHERE player_name = 'Jahmyr Gibbs'         AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 7800, base_value = 7800 WHERE player_name = 'De''Von Achane'       AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 7500, base_value = 7500 WHERE player_name = 'Ashton Jeanty'        AND format = 'dynasty';
-- Strong RB1s
UPDATE player_values_canonical SET adjusted_value = 6800, base_value = 6800 WHERE player_name = 'Omarion Hampton'      AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 6500, base_value = 6500 WHERE player_name = 'Jonathan Taylor'      AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 6000, base_value = 6000 WHERE player_name = 'TreVeyon Henderson'   AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 6000, base_value = 6000 WHERE player_name = 'James Cook'           AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 5800, base_value = 5800 WHERE player_name = 'Kyren Williams'       AND format = 'dynasty';
-- KEY FIX: Chase Brown is now CIN lead RB after Mixon left — massively undervalued at 800
UPDATE player_values_canonical SET adjusted_value = 4800, base_value = 4800 WHERE player_name = 'Chase Brown'          AND format = 'dynasty';
-- KEY FIX: Bucky Irving is now TB starter — undervalued at 2400
UPDATE player_values_canonical SET adjusted_value = 4800, base_value = 4800 WHERE player_name = 'Bucky Irving'         AND format = 'dynasty';
-- Mid-tier RBs
UPDATE player_values_canonical SET adjusted_value = 4800, base_value = 4800 WHERE player_name = 'Quinshon Judkins'     AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 4500, base_value = 4500 WHERE player_name = 'Saquon Barkley'       AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 4200, base_value = 4200 WHERE player_name = 'Kaleb Johnson'        AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 3500, base_value = 3500 WHERE player_name = 'Blake Corum'          AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 3200, base_value = 3200 WHERE player_name = 'Trey Benson'          AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 3500, base_value = 3500 WHERE player_name = 'Travis Etienne'       AND format = 'dynasty';
-- Aging/backup RBs
UPDATE player_values_canonical SET adjusted_value = 2200, base_value = 2200 WHERE player_name = 'Najee Harris'         AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 1500, base_value = 1500 WHERE player_name = 'Tony Pollard'         AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 1400, base_value = 1400 WHERE player_name = 'Derrick Henry'        AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 1000, base_value = 1000 WHERE player_name = 'D''Andre Swift'       AND format = 'dynasty';
-- KEY FIX: Rachaad White lost starting job to Bucky Irving
UPDATE player_values_canonical SET adjusted_value = 900,  base_value = 900  WHERE player_name = 'Rachaad White'        AND format = 'dynasty';
-- Ekeler likely retired/not on roster
UPDATE player_values_canonical SET adjusted_value = 300,  base_value = 300  WHERE player_name = 'Austin Ekeler'        AND format = 'dynasty';

-- ============================================================
-- WRs
-- ============================================================
-- Top tier
UPDATE player_values_canonical SET adjusted_value = 9800, base_value = 9800 WHERE player_name = 'Ja''Marr Chase'       AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 9000, base_value = 9000 WHERE player_name = 'Justin Jefferson'     AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 8800, base_value = 8800 WHERE player_name = 'CeeDee Lamb'          AND format = 'dynasty';
-- KEY FIX: Year-2 WRs massively undervalued
UPDATE player_values_canonical SET adjusted_value = 7800, base_value = 7800 WHERE player_name = 'Malik Nabers'         AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 7500, base_value = 7500 WHERE player_name = 'Marvin Harrison Jr.'  AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 7200, base_value = 7200 WHERE player_name = 'Brian Thomas Jr.'     AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 7200, base_value = 7200 WHERE player_name = 'Ladd McConkey'        AND format = 'dynasty';
-- Strong WR1s
UPDATE player_values_canonical SET adjusted_value = 7000, base_value = 7000 WHERE player_name = 'Garrett Wilson'       AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 7000, base_value = 7000 WHERE player_name = 'Jaxon Smith-Njigba'   AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 7000, base_value = 7000 WHERE player_name = 'Amon-Ra St. Brown'    AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 6800, base_value = 6800 WHERE player_name = 'Puka Nacua'           AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 6800, base_value = 6800 WHERE player_name = 'Drake London'         AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 6500, base_value = 6500 WHERE player_name = 'Nico Collins'         AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 6500, base_value = 6500 WHERE player_name = 'Zay Flowers'          AND format = 'dynasty';
-- Solid WR1/2s
UPDATE player_values_canonical SET adjusted_value = 6200, base_value = 6200 WHERE player_name = 'Rashee Rice'          AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 5800, base_value = 5800 WHERE player_name = 'Xavier Worthy'        AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 5800, base_value = 5800 WHERE player_name = 'Jordan Addison'       AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 5800, base_value = 5800 WHERE player_name = 'Tee Higgins'          AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 5800, base_value = 5800 WHERE player_name = 'Rome Odunze'          AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 5500, base_value = 5500 WHERE player_name = 'Keon Coleman'         AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 5500, base_value = 5500 WHERE player_name = 'Chris Olave'          AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 5500, base_value = 5500 WHERE player_name = 'DeVonta Smith'        AND format = 'dynasty';
-- Mid-tier WRs
UPDATE player_values_canonical SET adjusted_value = 4800, base_value = 4800 WHERE player_name = 'Tank Dell'            AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 4800, base_value = 4800 WHERE player_name = 'DJ Moore'             AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 4500, base_value = 4500 WHERE player_name = 'Jahan Dotson'         AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 4000, base_value = 4000 WHERE player_name = 'Michael Pittman'      AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 4000, base_value = 4000 WHERE player_name = 'Michael Pittman Jr.'  AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 3800, base_value = 3800 WHERE player_name = 'Josh Downs'           AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 3500, base_value = 3500 WHERE player_name = 'Jerry Jeudy'          AND format = 'dynasty';
-- Aging/declining WRs
UPDATE player_values_canonical SET adjusted_value = 2500, base_value = 2500 WHERE player_name = 'Davante Adams'        AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 2000, base_value = 2000 WHERE player_name = 'Christian Watson'     AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 1500, base_value = 1500 WHERE player_name = 'Mike Evans'           AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 600,  base_value = 600  WHERE player_name = 'Treylon Burks'        AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 700,  base_value = 700  WHERE player_name = 'Calvin Austin'        AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 400,  base_value = 400  WHERE player_name = 'Skyy Moore'           AND format = 'dynasty';

-- ============================================================
-- TEs
-- ============================================================
-- Bowers is the #1 dynasty TE by a wide margin
UPDATE player_values_canonical SET adjusted_value = 8500, base_value = 8500 WHERE player_name = 'Brock Bowers'         AND format = 'dynasty';
-- McBride is an ascending elite TE, should be TE2 not TE3
UPDATE player_values_canonical SET adjusted_value = 7500, base_value = 7500 WHERE player_name = 'Trey McBride'         AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 6200, base_value = 6200 WHERE player_name = 'Sam LaPorta'          AND format = 'dynasty';
-- 2025 rookie TEs with great situations
UPDATE player_values_canonical SET adjusted_value = 5500, base_value = 5500 WHERE player_name = 'Colston Loveland'     AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 5500, base_value = 5500 WHERE player_name = 'Tucker Kraft'         AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 5200, base_value = 5200 WHERE player_name = 'Tyler Warren'         AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 5200, base_value = 5200 WHERE player_name = 'Jake Ferguson'        AND format = 'dynasty';
-- Solid mid-tier TEs
UPDATE player_values_canonical SET adjusted_value = 4000, base_value = 4000 WHERE player_name = 'Dalton Kincaid'       AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 3800, base_value = 3800 WHERE player_name = 'Isaiah Likely'        AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 2500, base_value = 2500 WHERE player_name = 'T.J. Hockenson'       AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 2000, base_value = 2000 WHERE player_name = 'Travis Kelce'         AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 2000, base_value = 2000 WHERE player_name = 'Luke Musgrave'        AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 1400, base_value = 1400 WHERE player_name = 'Michael Mayer'        AND format = 'dynasty';
UPDATE player_values_canonical SET adjusted_value = 800,  base_value = 800  WHERE player_name = 'Evan Engram'          AND format = 'dynasty';

-- ============================================================
-- Recompute rank_overall for dynasty format
-- ============================================================
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY format
      ORDER BY adjusted_value DESC NULLS LAST
    ) AS new_rank
  FROM player_values_canonical
  WHERE format = 'dynasty'
)
UPDATE player_values_canonical pvc
SET rank_overall = ranked.new_rank
FROM ranked
WHERE pvc.id = ranked.id;
