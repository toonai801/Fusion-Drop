/**
 * Supabase Backend Client for Fusion Drop
 * 
 * This module replaces the local server.js backend with Supabase REST API calls.
 * 
 * Usage:
 *   const backend = new SupabaseBackend(SUPABASE_URL, SUPABASE_KEY);
 *   backend.fetchScores().then(scores => console.log(scores));
 *   backend.saveScore('Player', 1000, 5);
 *   backend.heartbeat('Player', 1000);
 *   backend.fetchActivePlayers().then(players => console.log(players));
 */

class SupabaseBackend {
    constructor(supabaseUrl, supabaseKey) {
        this.url = supabaseUrl;
        this.key = supabaseKey;
        this.headers = {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        };
    }

    /**
     * Fetch top 50 scores ordered by score descending
     * @returns {Promise<Array>} Array of {player_name, score, level, created_at}
     */
    async fetchScores() {
        try {
            const response = await fetch(
                `${this.url}/rest/v1/scores?select=*&order=score.desc&limit=50`,
                { headers: this.headers }
            );
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (e) {
            console.error('fetchScores failed:', e);
            return [];
        }
    }

    /**
     * Save a score to the leaderboard
     * @param {string} playerName
     * @param {number} score
     * @param {number} level
     * @returns {Promise<boolean>}
     */
    async saveScore(playerName, score, level = 1) {
        try {
            const response = await fetch(`${this.url}/rest/v1/scores`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({ player_name: playerName, score, level })
            });
            return response.ok;
        } catch (e) {
            console.error('saveScore failed:', e);
            return false;
        }
    }

    /**
     * Send heartbeat (update active player score)
     * @param {string} playerName
     * @param {number} score
     * @returns {Promise<boolean>}
     */
    async heartbeat(playerName, score) {
        try {
            // Upsert: insert if new, update if exists
            const response = await fetch(`${this.url}/rest/v1/active_players`, {
                method: 'POST',
                headers: {
                    ...this.headers,
                    'Prefer': 'resolution=merge-duplicates,return=representation'
                },
                body: JSON.stringify({ player_name: playerName, score, last_seen: new Date().toISOString() })
            });
            return response.ok;
        } catch (e) {
            console.error('heartbeat failed:', e);
            return false;
        }
    }

    /**
     * Fetch currently active players (last 60 seconds)
     * Note: Requires cleanup of old entries (handled by client or cron)
     * @returns {Promise<Array>}
     */
    async fetchActivePlayers() {
        try {
            const sixtySecondsAgo = new Date(Date.now() - 60000).toISOString();
            const response = await fetch(
                `${this.url}/rest/v1/active_players?select=*&last_seen=gte.${sixtySecondsAgo}&order=last_seen.desc`,
                { headers: this.headers }
            );
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (e) {
            console.error('fetchActivePlayers failed:', e);
            return [];
        }
    }

    /**
     * Clean up old entries from local cache (client-side only)
     * Note: Real cleanup should happen server-side via Supabase cron or Edge Function
     */
    async cleanupInactive() {
        // For now, we rely on the client filtering by last_seen
        // Server-side cleanup can be added via Supabase Edge Functions later
        console.log('cleanupInactive: server-side cleanup not implemented');
    }
}

// Export for module usage (or attach to window for script tag)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SupabaseBackend };
} else {
    window.SupabaseBackend = SupabaseBackend;
}
