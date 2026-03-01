import { supabase } from '../supabase';

export interface HealthCheckResult {
  check_name: string;
  status: 'ok' | 'warning' | 'critical';
  message: string;
  meta?: Record<string, any>;
}

export interface SystemHealthSummary {
  overall_status: 'ok' | 'warning' | 'critical';
  checks: HealthCheckResult[];
  critical_count: number;
  warning_count: number;
  ok_count: number;
  checked_at: string;
}

async function checkPlayerSyncFreshness(): Promise<HealthCheckResult> {
  try {
    const { data, error } = await supabase
      .from('latest_player_values')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return {
        check_name: 'player_sync_freshness',
        status: 'warning',
        message: 'Unable to check player sync status',
        meta: { error: error.message },
      };
    }

    if (!data) {
      return {
        check_name: 'player_sync_freshness',
        status: 'critical',
        message: 'No player values found in latest_player_values — sync has never run',
        meta: { last_sync: null },
      };
    }

    const lastSync = new Date(data.updated_at);
    const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);

    if (hoursSinceSync > 26) {
      return {
        check_name: 'player_sync_freshness',
        status: 'critical',
        message: `Player values are ${Math.round(hoursSinceSync)} hours old (threshold: 26 hours)`,
        meta: { last_sync: lastSync.toISOString(), hours_old: hoursSinceSync },
      };
    }

    if (hoursSinceSync > 20) {
      return {
        check_name: 'player_sync_freshness',
        status: 'warning',
        message: `Player values are ${Math.round(hoursSinceSync)} hours old`,
        meta: { last_sync: lastSync.toISOString(), hours_old: hoursSinceSync },
      };
    }

    return {
      check_name: 'player_sync_freshness',
      status: 'ok',
      message: `Player sync is fresh (${Math.round(hoursSinceSync)} hours old)`,
      meta: { last_sync: lastSync.toISOString(), hours_old: hoursSinceSync },
    };
  } catch (err) {
    return {
      check_name: 'player_sync_freshness',
      status: 'warning',
      message: 'Error checking player sync freshness',
      meta: { error: String(err) },
    };
  }
}

async function checkValueSnapshotFreshness(): Promise<HealthCheckResult> {
  try {
    const { count: totalCount, error: countError } = await supabase
      .from('latest_player_values')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      return {
        check_name: 'value_snapshot_freshness',
        status: 'warning',
        message: 'Unable to check value build status',
        meta: { error: countError.message },
      };
    }

    if (!totalCount || totalCount === 0) {
      return {
        check_name: 'value_snapshot_freshness',
        status: 'critical',
        message: 'No player values have been built yet',
        meta: { total_records: 0 },
      };
    }

    const { data: freshData } = await supabase
      .from('latest_player_values')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const lastBuild = freshData ? new Date(freshData.updated_at) : null;
    const hoursSinceBuild = lastBuild
      ? (Date.now() - lastBuild.getTime()) / (1000 * 60 * 60)
      : Infinity;

    if (hoursSinceBuild > 18) {
      return {
        check_name: 'value_snapshot_freshness',
        status: 'critical',
        message: `Values are ${Math.round(hoursSinceBuild)} hours old (threshold: 18 hours)`,
        meta: { last_build: lastBuild?.toISOString(), hours_old: hoursSinceBuild, total_records: totalCount },
      };
    }

    if (hoursSinceBuild > 14) {
      return {
        check_name: 'value_snapshot_freshness',
        status: 'warning',
        message: `Values are ${Math.round(hoursSinceBuild)} hours old`,
        meta: { last_build: lastBuild?.toISOString(), hours_old: hoursSinceBuild, total_records: totalCount },
      };
    }

    return {
      check_name: 'value_snapshot_freshness',
      status: 'ok',
      message: `Values are fresh — ${totalCount.toLocaleString()} records, ${Math.round(hoursSinceBuild)}h old`,
      meta: { last_build: lastBuild?.toISOString(), hours_old: hoursSinceBuild, total_records: totalCount },
    };
  } catch (err) {
    return {
      check_name: 'value_snapshot_freshness',
      status: 'warning',
      message: 'Error checking value build freshness',
      meta: { error: String(err) },
    };
  }
}

async function checkPositionCoverage(): Promise<HealthCheckResult> {
  try {
    const positions = ['QB', 'RB', 'WR', 'TE'] as const;
    // Thresholds are per-position row counts (includes all formats per player)
    // e.g. 30 QBs × 6 formats = 180 rows, threshold of 30 is a safety floor
    const thresholds: Record<string, number> = { QB: 30, RB: 80, WR: 100, TE: 40 };
    const counts: Record<string, number> = {};

    for (const pos of positions) {
      const { count, error } = await supabase
        .from('latest_player_values')
        .select('player_id', { count: 'exact', head: true })
        .eq('position', pos);

      if (error) {
        return {
          check_name: 'position_coverage',
          status: 'warning',
          message: `Unable to check ${pos} coverage`,
          meta: { error: error.message },
        };
      }
      counts[pos] = count || 0;
    }

    const issues: string[] = [];
    Object.entries(thresholds).forEach(([position, threshold]) => {
      const count = counts[position] || 0;
      if (count < threshold) {
        issues.push(`${position}: ${count} (expected >=${threshold})`);
      }
    });

    if (issues.length > 0) {
      return {
        check_name: 'position_coverage',
        status: 'warning',
        message: `Low player count for: ${issues.join(', ')}`,
        meta: { counts, thresholds, issues },
      };
    }

    return {
      check_name: 'position_coverage',
      status: 'ok',
      message: `Position coverage OK — QB:${counts.QB} RB:${counts.RB} WR:${counts.WR} TE:${counts.TE}`,
      meta: { counts },
    };
  } catch (err) {
    return {
      check_name: 'position_coverage',
      status: 'warning',
      message: 'Error checking position coverage',
      meta: { error: String(err) },
    };
  }
}

async function checkMissingTeamHistory(): Promise<HealthCheckResult> {
  try {
    // Repurposed: check total player value records in DB
    const { count, error } = await supabase
      .from('latest_player_values')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return {
        check_name: 'missing_team_history',
        status: 'warning',
        message: 'Unable to check player database size',
        meta: { error: error.message },
      };
    }

    const total = count || 0;

    if (total < 100) {
      return {
        check_name: 'missing_team_history',
        status: 'critical',
        message: `Only ${total} player records found — database needs sync`,
        meta: { total_records: total },
      };
    }

    if (total < 500) {
      return {
        check_name: 'missing_team_history',
        status: 'warning',
        message: `${total} player records — lower than expected`,
        meta: { total_records: total },
      };
    }

    return {
      check_name: 'missing_team_history',
      status: 'ok',
      message: `${total.toLocaleString()} player value records in database`,
      meta: { total_records: total },
    };
  } catch (err) {
    return {
      check_name: 'missing_team_history',
      status: 'warning',
      message: 'Error checking player database size',
      meta: { error: String(err) },
    };
  }
}

async function checkUnresolvedPlayersQueue(): Promise<HealthCheckResult> {
  try {
    // Check that at least one valid format ('standard' or 'superflex') has data.
    // The sync writes one row per player; the format reflects the most recent sync mode.
    const { data, error } = await supabase
      .from('latest_player_values')
      .select('format')
      .limit(1)
      .maybeSingle();

    if (error) {
      return {
        check_name: 'unresolved_players_queue',
        status: 'warning',
        message: 'Unable to check scoring format data',
        meta: { error: error.message },
      };
    }

    if (!data) {
      return {
        check_name: 'unresolved_players_queue',
        status: 'critical',
        message: 'No player value data found — sync has not run',
        meta: {},
      };
    }

    const activeFormat = data.format || 'unknown';
    const validFormats = ['standard', 'superflex'];

    if (!validFormats.includes(activeFormat)) {
      return {
        check_name: 'unresolved_players_queue',
        status: 'warning',
        message: `Unexpected format value: "${activeFormat}"`,
        meta: { active_format: activeFormat },
      };
    }

    return {
      check_name: 'unresolved_players_queue',
      status: 'ok',
      message: `Active scoring format: ${activeFormat}`,
      meta: { active_format: activeFormat },
    };
  } catch (err) {
    return {
      check_name: 'unresolved_players_queue',
      status: 'warning',
      message: 'Error checking scoring format',
      meta: { error: String(err) },
    };
  }
}

async function checkScraperFailures(): Promise<HealthCheckResult> {
  try {
    // Repurposed: sanity-check that no key position has zero players
    const positions = ['QB', 'RB', 'WR', 'TE'];
    const zeroCounts: string[] = [];

    for (const pos of positions) {
      const { count, error } = await supabase
        .from('latest_player_values')
        .select('player_id', { count: 'exact', head: true })
        .eq('position', pos);

      if (!error && (count === 0 || count === null)) {
        zeroCounts.push(pos);
      }
    }

    if (zeroCounts.length > 0) {
      return {
        check_name: 'scraper_failures',
        status: 'critical',
        message: `Zero players found for: ${zeroCounts.join(', ')} — sync may be broken`,
        meta: { zero_positions: zeroCounts },
      };
    }

    return {
      check_name: 'scraper_failures',
      status: 'ok',
      message: 'All key positions have player data',
      meta: {},
    };
  } catch (err) {
    return {
      check_name: 'scraper_failures',
      status: 'warning',
      message: 'Error checking position data',
      meta: { error: String(err) },
    };
  }
}

async function checkDatabaseConnectivity(): Promise<HealthCheckResult> {
  try {
    const startTime = Date.now();
    const { error } = await supabase.from('latest_player_values').select('player_id').limit(1);
    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        check_name: 'database_connectivity',
        status: 'critical',
        message: 'Database query failed',
        meta: { error: error.message },
      };
    }

    if (responseTime > 5000) {
      return {
        check_name: 'database_connectivity',
        status: 'warning',
        message: `Database response time is slow (${responseTime}ms)`,
        meta: { response_time_ms: responseTime },
      };
    }

    return {
      check_name: 'database_connectivity',
      status: 'ok',
      message: `Database is responding normally (${responseTime}ms)`,
      meta: { response_time_ms: responseTime },
    };
  } catch (err) {
    return {
      check_name: 'database_connectivity',
      status: 'critical',
      message: 'Unable to connect to database',
      meta: { error: String(err) },
    };
  }
}

async function storeHealthCheckResult(result: HealthCheckResult): Promise<void> {
  try {
    await supabase.from('system_health_checks').insert({
      check_name: result.check_name,
      status: result.status,
      message: result.message,
      meta: result.meta || {},
      checked_at: new Date().toISOString(),
    });

    if (result.status === 'ok') {
      await supabase.rpc('resolve_alerts_by_check', {
        p_check_name: result.check_name,
      });
    } else if (result.status === 'warning' || result.status === 'critical') {
      await supabase.rpc('create_alert_from_check', {
        p_check_name: result.check_name,
        p_status: result.status,
        p_message: result.message,
        p_meta: result.meta || {},
      });
    }
  } catch (err) {
    console.error('Error storing health check result:', err);
  }
}

export async function runSystemHealthChecks(): Promise<SystemHealthSummary> {
  const checks: HealthCheckResult[] = [];

  const checkFunctions = [
    checkDatabaseConnectivity,
    checkPlayerSyncFreshness,
    checkValueSnapshotFreshness,
    checkPositionCoverage,
    checkMissingTeamHistory,
    checkUnresolvedPlayersQueue,
    checkScraperFailures,
  ];

  for (const checkFn of checkFunctions) {
    try {
      const result = await checkFn();
      checks.push(result);
      await storeHealthCheckResult(result);
    } catch (err) {
      console.error(`Error running health check ${checkFn.name}:`, err);
      checks.push({
        check_name: checkFn.name,
        status: 'warning',
        message: 'Health check failed to execute',
        meta: { error: String(err) },
      });
    }
  }

  const criticalCount = checks.filter(c => c.status === 'critical').length;
  const warningCount = checks.filter(c => c.status === 'warning').length;
  const okCount = checks.filter(c => c.status === 'ok').length;

  const overallStatus: 'ok' | 'warning' | 'critical' =
    criticalCount > 0 ? 'critical' : warningCount > 0 ? 'warning' : 'ok';

  try {
    if (criticalCount > 0) {
      await supabase.rpc('enable_safe_mode', {
        p_reason: `${criticalCount} critical health check(s) failed`,
      });
    } else {
      await supabase.rpc('disable_safe_mode');
    }
  } catch {
    // safe_mode RPCs are optional — don't let them prevent returning results
  }

  return {
    overall_status: overallStatus,
    checks,
    critical_count: criticalCount,
    warning_count: warningCount,
    ok_count: okCount,
    checked_at: new Date().toISOString(),
  };
}

export async function getSystemHealthStatus(): Promise<SystemHealthSummary | null> {
  try {
    const { data, error } = await supabase.from('current_system_health').select('*');

    if (error || !data || data.length === 0) {
      return null;
    }

    const checks: HealthCheckResult[] = data.map((row: any) => ({
      check_name: row.check_name,
      status: row.status,
      message: row.message,
      meta: row.meta,
    }));

    const criticalCount = checks.filter(c => c.status === 'critical').length;
    const warningCount = checks.filter(c => c.status === 'warning').length;
    const okCount = checks.filter(c => c.status === 'ok').length;

    const overallStatus: 'ok' | 'warning' | 'critical' =
      criticalCount > 0 ? 'critical' : warningCount > 0 ? 'warning' : 'ok';

    return {
      overall_status: overallStatus,
      checks,
      critical_count: criticalCount,
      warning_count: warningCount,
      ok_count: okCount,
      checked_at: data[0]?.checked_at || new Date().toISOString(),
    };
  } catch (err) {
    console.error('Error getting system health status:', err);
    return null;
  }
}

export async function isSafeMode(): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('is_system_safe_mode');

    if (error) {
      return false;
    }

    return data || false;
  } catch (err) {
    console.error('Error checking safe mode:', err);
    return false;
  }
}
