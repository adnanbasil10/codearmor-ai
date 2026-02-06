import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Supabase] Missing credentials. History features will be disabled.');
}

export const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export interface ScanHistory {
    id: string;
    user_id: string;
    user_email: string;
    scan_type: 'snippet' | 'repo' | 'pr';
    target: string;
    owner?: string;
    repo?: string;
    pr_number?: number;
    security_score: number;
    risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
    findings_count: number;
    definite_count: number;
    potential_count: number;
    regressions_count: number;
    created_at: string;
    scan_data?: any;
}

export interface PRFix {
    id: string;
    user_id: string;
    user_email: string;
    owner: string;
    repo: string;
    pr_number: number;
    pr_url: string;
    branch_name: string;
    fixes_applied: number;
    status: 'open' | 'merged' | 'closed';
    created_at: string;
}

export interface RegressionDetected {
    id: string;
    user_id: string;
    user_email: string;
    owner: string;
    repo: string;
    pr_number: number;
    original_fix_pr: number;
    file_affected: string;
    severity: string;
    detected_at: string;
}

export async function saveScanHistory(data: Omit<ScanHistory, 'id' | 'created_at'>) {
    if (!supabase) return null;

    const { data: result, error } = await supabase
        .from('scan_history')
        .insert(data)
        .select()
        .single();

    if (error) {
        console.error('[Supabase] Error saving scan history:', error);
        return null;
    }

    return result;
}

export async function savePRFix(data: Omit<PRFix, 'id' | 'created_at'>) {
    if (!supabase) return null;

    const { data: result, error } = await supabase
        .from('pr_fixes')
        .insert(data)
        .select()
        .single();

    if (error) {
        console.error('[Supabase] Error saving PR fix:', error);
        return null;
    }

    return result;
}

export async function saveRegression(data: Omit<RegressionDetected, 'id' | 'detected_at'>) {
    if (!supabase) return null;

    const { data: result, error } = await supabase
        .from('regressions_detected')
        .insert(data)
        .select()
        .single();

    if (error) {
        console.error('[Supabase] Error saving regression:', error);
        return null;
    }

    return result;
}

export async function getUserScanHistory(userId: string, limit = 50): Promise<ScanHistory[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('scan_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('[Supabase] Error fetching scan history:', error);
        return [];
    }

    return data || [];
}

export async function getUserPRFixes(userId: string, limit = 50): Promise<PRFix[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('pr_fixes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('[Supabase] Error fetching PR fixes:', error);
        return [];
    }

    return data || [];
}

export async function getUserRegressions(userId: string, limit = 50): Promise<RegressionDetected[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('regressions_detected')
        .select('*')
        .eq('user_id', userId)
        .order('detected_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('[Supabase] Error fetching regressions:', error);
        return [];
    }

    return data || [];
}
