
CREATE TABLE IF NOT EXISTS daily_challenge_completions (
    id BIGSERIAL PRIMARY KEY,

    user_id INTEGER NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    challenge_date DATE NOT NULL,

    challenge_title VARCHAR(100) NOT NULL,

    wpm NUMERIC(7, 2) NOT NULL
        CHECK (wpm >= 0),

    accuracy NUMERIC(5, 2) NOT NULL
        CHECK (accuracy >= 0 AND accuracy <= 100),

    duration_seconds INTEGER NOT NULL
        CHECK (duration_seconds > 0),

    points INTEGER NOT NULL DEFAULT 0
        CHECK (points >= 0),

    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (user_id, challenge_date)
);

CREATE INDEX IF NOT EXISTS
    idx_daily_challenges_user_date
ON daily_challenge_completions(user_id, challenge_date DESC);
