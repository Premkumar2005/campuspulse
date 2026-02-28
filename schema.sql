CREATE DATABASE IF NOT EXISTS campuspulse;
USE campuspulse;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role VARCHAR(20) DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE raw_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  event_type VARCHAR(50) NOT NULL,
  route VARCHAR(100) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE event_summary (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  total_count INT DEFAULT 0,
  UNIQUE KEY unique_date_event (date, event_type)
);

CREATE TABLE user_engagement (
  user_id INT PRIMARY KEY,
  total_events INT DEFAULT 0,
  last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_user_id   ON raw_events(user_id);
CREATE INDEX idx_timestamp ON raw_events(timestamp);
CREATE INDEX idx_event_type ON raw_events(event_type);
CREATE INDEX idx_processed  ON raw_events(processed);