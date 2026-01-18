// Local leaderboard storage and management

const STORAGE_KEY = 'voidrunner_leaderboards';
const MAX_ENTRIES = 10;

export class LeaderboardSystem {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load leaderboards:', e);
    }

    // Default structure
    return {
      campaign: [],
      voidrush: [],
      endless: []
    };
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Failed to save leaderboards:', e);
    }
  }

  // Add a new entry and return the rank (1-indexed), or 0 if not a high score
  addEntry(mode, stats) {
    if (!this.data[mode]) {
      this.data[mode] = [];
    }

    const entry = {
      ...stats,
      date: new Date().toISOString()
    };

    // Add to list
    this.data[mode].push(entry);

    // Sort based on mode
    this.sortEntries(mode);

    // Trim to max entries
    if (this.data[mode].length > MAX_ENTRIES) {
      this.data[mode] = this.data[mode].slice(0, MAX_ENTRIES);
    }

    this.save();

    // Return rank if in top 10
    const rank = this.data[mode].findIndex(e => e === entry) + 1;
    return rank <= MAX_ENTRIES ? rank : 0;
  }

  sortEntries(mode) {
    if (mode === 'endless') {
      // Endless: sort by time survived (descending)
      this.data[mode].sort((a, b) => b.time - a.time);
    } else {
      // Campaign and Void Rush: sort by zone (desc), then time (asc)
      this.data[mode].sort((a, b) => {
        if (b.zone !== a.zone) {
          return b.zone - a.zone;
        }
        return a.time - b.time; // Lower time is better for same zone
      });
    }
  }

  getTop(mode, count = 5) {
    return (this.data[mode] || []).slice(0, count);
  }

  isHighScore(mode, stats) {
    const entries = this.data[mode] || [];

    if (entries.length < MAX_ENTRIES) {
      return true; // Always a high score if list isn't full
    }

    const worst = entries[entries.length - 1];

    if (mode === 'endless') {
      return stats.time > worst.time;
    } else {
      // Campaign/Void Rush
      if (stats.zone > worst.zone) return true;
      if (stats.zone === worst.zone && stats.time < worst.time) return true;
      return false;
    }
  }

  getRank(mode, stats) {
    const entries = this.data[mode] || [];

    for (let i = 0; i < entries.length; i++) {
      if (mode === 'endless') {
        if (stats.time >= entries[i].time) {
          return i + 1;
        }
      } else {
        if (stats.zone > entries[i].zone) {
          return i + 1;
        }
        if (stats.zone === entries[i].zone && stats.time <= entries[i].time) {
          return i + 1;
        }
      }
    }

    return entries.length + 1;
  }

  getBest(mode) {
    const entries = this.data[mode] || [];
    return entries.length > 0 ? entries[0] : null;
  }

  clear(mode) {
    if (mode) {
      this.data[mode] = [];
    } else {
      this.data = { campaign: [], voidrush: [], endless: [] };
    }
    this.save();
  }

  // Format time for display
  static formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${secs}s`;
  }
}
