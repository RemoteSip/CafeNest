-- WorkCafe Database Schema

-- Create Users Table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    profile_image VARCHAR(255),
    bio TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Cafes Table
CREATE TABLE cafes (
    cafe_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(50) NOT NULL,
    state VARCHAR(50),
    zip_code VARCHAR(20),
    country VARCHAR(50) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    phone VARCHAR(20),
    website VARCHAR(255),
    description TEXT,
    hours JSON, -- Stores opening hours for each day of the week
    wifi_speed INTEGER, -- in Mbps
    wifi_reliability INTEGER, -- 1-10 rating
    power_outlets INTEGER, -- 0=None, 1=Limited, 2=Some, 3=Many
    noise_level INTEGER, -- 1=Silent, 2=Quiet, 3=Moderate, 4=Loud, 5=Very Loud
    coffee_quality INTEGER, -- 1-5 rating
    food_quality INTEGER, -- 1-5 rating
    price_level INTEGER, -- 1-4 rating ($, $$, $$$, $$$$)
    occupancy_limit INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Cafe Images Table
CREATE TABLE cafe_images (
    image_id SERIAL PRIMARY KEY,
    cafe_id INTEGER REFERENCES cafes(cafe_id) ON DELETE CASCADE,
    image_url VARCHAR(255) NOT NULL,
    caption TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Amenities Table
CREATE TABLE amenities (
    amenity_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    icon VARCHAR(50),
    category VARCHAR(50)
);

-- Create Cafe-Amenities Join Table
CREATE TABLE cafe_amenities (
    cafe_id INTEGER REFERENCES cafes(cafe_id) ON DELETE CASCADE,
    amenity_id INTEGER REFERENCES amenities(amenity_id) ON DELETE CASCADE,
    PRIMARY KEY (cafe_id, amenity_id)
);

-- Create Categories Table
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT
);

-- Create Cafe-Categories Join Table
CREATE TABLE cafe_categories (
    cafe_id INTEGER REFERENCES cafes(cafe_id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(category_id) ON DELETE CASCADE,
    PRIMARY KEY (cafe_id, category_id)
);

-- Create Reviews Table
CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    cafe_id INTEGER REFERENCES cafes(cafe_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    wifi_rating INTEGER CHECK (wifi_rating BETWEEN 1 AND 5),
    power_rating INTEGER CHECK (power_rating BETWEEN 1 AND 5),
    comfort_rating INTEGER CHECK (comfort_rating BETWEEN 1 AND 5),
    noise_rating INTEGER CHECK (noise_rating BETWEEN 1 AND 5),
    coffee_rating INTEGER CHECK (coffee_rating BETWEEN 1 AND 5),
    food_rating INTEGER CHECK (food_rating BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Check-ins Table
CREATE TABLE check_ins (
    check_in_id SERIAL PRIMARY KEY,
    cafe_id INTEGER REFERENCES cafes(cafe_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    check_out_time TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active', -- active, completed, cancelled
    occupancy_report INTEGER -- User reported occupancy (percentage)
);

-- Create Favorite Cafes Table
CREATE TABLE favorites (
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    cafe_id INTEGER REFERENCES cafes(cafe_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, cafe_id)
);

-- Create Current Occupancy View
CREATE OR REPLACE VIEW current_occupancy AS
SELECT 
    c.cafe_id,
    c.name,
    COUNT(ci.check_in_id) AS active_users,
    c.occupancy_limit,
    CASE 
        WHEN c.occupancy_limit > 0 THEN 
            ROUND((COUNT(ci.check_in_id)::NUMERIC / c.occupancy_limit) * 100)
        ELSE 0
    END AS occupancy_percentage
FROM 
    cafes c
LEFT JOIN 
    check_ins ci ON c.cafe_id = ci.cafe_id AND ci.status = 'active' AND ci.check_out_time IS NULL
GROUP BY 
    c.cafe_id, c.name, c.occupancy_limit;

-- Create Cafe Rating Summary View
CREATE OR REPLACE VIEW cafe_rating_summary AS
SELECT 
    c.cafe_id,
    c.name,
    ROUND(AVG(r.rating), 1) AS overall_rating,
    COUNT(r.review_id) AS review_count,
    ROUND(AVG(r.wifi_rating), 1) AS avg_wifi_rating,
    ROUND(AVG(r.power_rating), 1) AS avg_power_rating,
    ROUND(AVG(r.comfort_rating), 1) AS avg_comfort_rating,
    ROUND(AVG(r.noise_rating), 1) AS avg_noise_rating,
    ROUND(AVG(r.coffee_rating), 1) AS avg_coffee_rating,
    ROUND(AVG(r.food_rating), 1) AS avg_food_rating
FROM 
    cafes c
LEFT JOIN 
    reviews r ON c.cafe_id = r.cafe_id
GROUP BY 
    c.cafe_id, c.name;

-- Insert some default amenities
INSERT INTO amenities (name, icon, category) VALUES 
('Fast Wi-Fi', 'wifi', 'connectivity'),
('Power Outlets', 'power', 'connectivity'),
('Quiet Space', 'quiet', 'atmosphere'),
('Meeting Room', 'meeting', 'workspace'),
('Standing Desk', 'standing-desk', 'workspace'),
('Outdoor Seating', 'outdoor', 'seating'),
('Group Tables', 'group-table', 'seating'),
('Private Booths', 'booth', 'seating'),
('Parking', 'parking', 'access'),
('Public Transport', 'bus', 'access'),
('Bike Parking', 'bike', 'access'),
('Open Late', 'clock', 'hours'),
('Weekend Hours', 'calendar', 'hours'),
('Vegetarian Options', 'vegetarian', 'food'),
('Gluten-Free Options', 'gluten-free', 'food'),
('Specialty Coffee', 'coffee', 'drinks'),
('Alcohol', 'beer', 'drinks');

-- Insert some default categories
INSERT INTO categories (name, description) VALUES 
('Quiet Work', 'Perfect for focused work and concentration'),
('Group-Friendly', 'Good for team meetings and collaboration'),
('Digital Nomad Friendly', 'Well-suited for all-day remote work'),
('Study-Friendly', 'Great for students and studying'),
('Art & Creative', 'Inspiring atmosphere for creative work'),
('Pet-Friendly', 'Allows well-behaved pets'),
('Late Night', 'Open late for night owls'),
('Outdoor Space', 'Has outdoor seating options');
