CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    avatar TEXT,
    bio TEXT,
    rating FLOAT DEFAULT 0,
    skills JSON,
    completed_tasks_count INT DEFAULT 0,
    is_online INT DEFAULT 0,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_email ON users(email);

CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    required_skills JSON,
    duration VARCHAR(50),
    attachments JSON,
    status VARCHAR(50) DEFAULT 'open',
    author_id VARCHAR(255) NOT NULL,
    assigned_to_user VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id),
    FOREIGN KEY (assigned_to_user) REFERENCES users(id)
);

CREATE INDEX idx_task_author_id ON tasks(author_id);
CREATE INDEX idx_task_assigned_to_user ON tasks(assigned_to_user);
CREATE INDEX idx_task_status ON tasks(status);

CREATE TABLE IF NOT EXISTS applications (
    id VARCHAR(255) PRIMARY KEY,
    task_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    comment TEXT,
    budget VARCHAR(50),
    estimated_duration VARCHAR(50),
    attachments JSON,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_app_task_id ON applications(task_id);
CREATE INDEX idx_app_user_id ON applications(user_id);
CREATE INDEX idx_app_status ON applications(status);

CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(255) PRIMARY KEY,
    task_id VARCHAR(255) NOT NULL,
    sender_id VARCHAR(255) NOT NULL,
    receiver_id VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    attachments JSON,
    reply_to_id VARCHAR(255),
    reactions JSON,
    read_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_msg_task_id ON messages(task_id);
CREATE INDEX idx_msg_sender_id ON messages(sender_id);
CREATE INDEX idx_msg_receiver_id ON messages(receiver_id);

CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50),
    target_id VARCHAR(255),
    is_read INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notif_user_id ON notifications(user_id);

CREATE TABLE IF NOT EXISTS ratings (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    rater_id VARCHAR(255) NOT NULL,
    task_id VARCHAR(255),
    score INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rating_user_id ON ratings(user_id);
CREATE INDEX idx_rating_task_id ON ratings(task_id);

CREATE TABLE IF NOT EXISTS reviews (
    id VARCHAR(255) PRIMARY KEY,
    task_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    rater_id VARCHAR(255) NOT NULL,
    rating INT NOT NULL,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_review_user_id ON reviews(user_id);
CREATE INDEX idx_review_task_id ON reviews(task_id);

CREATE TABLE IF NOT EXISTS team_members (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    added_by_id VARCHAR(255),
    role VARCHAR(50) DEFAULT 'member',
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS task_status_history (
    id VARCHAR(255) PRIMARY KEY,
    task_id VARCHAR(255) NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by_id VARCHAR(255),
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS allowed_emails (
    email VARCHAR(255) PRIMARY KEY,
    added_by_id VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS access_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    action VARCHAR(255),
    status VARCHAR(50),
    user_agent TEXT,
    attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
