-- Create database if it does not exist
CREATE DATABASE IF NOT EXISTS bloodconnect;
USE bloodconnect;

-- Create donors table
CREATE TABLE IF NOT EXISTS donors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    blood_group VARCHAR(5) NOT NULL,
    city VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(100) NOT NULL,
    active TINYINT(1) DEFAULT 1,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create requests table
CREATE TABLE IF NOT EXISTS requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_name VARCHAR(255) NOT NULL,
    blood_group VARCHAR(5) NOT NULL,
    hospital VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    urgency ENUM('critical', 'medium', 'low') NOT NULL,
    status ENUM('pending', 'fulfilled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert seed donors (if empty)
INSERT INTO donors (name, blood_group, city, phone, email, active) 
SELECT 'Rahul Sharma', 'O+', 'Delhi', '9876543210', 'rahul@gmail.com', 1
WHERE NOT EXISTS (SELECT 1 FROM donors WHERE email = 'rahul@gmail.com');

INSERT INTO donors (name, blood_group, city, phone, email, active) 
SELECT 'Priya Patel', 'B+', 'Mumbai', '9123456789', 'priya@yahoo.com', 1
WHERE NOT EXISTS (SELECT 1 FROM donors WHERE email = 'priya@yahoo.com');

INSERT INTO donors (name, blood_group, city, phone, email, active) 
SELECT 'Amit Verma', 'A-', 'Delhi', '9898989898', 'amit.v@outlook.com', 1
WHERE NOT EXISTS (SELECT 1 FROM donors WHERE email = 'amit.v@outlook.com');

INSERT INTO donors (name, blood_group, city, phone, email, active) 
SELECT 'Sneha Reddy', 'AB+', 'Bangalore', '8877665544', 'sneha@rediff.com', 1
WHERE NOT EXISTS (SELECT 1 FROM donors WHERE email = 'sneha@rediff.com');

INSERT INTO donors (name, blood_group, city, phone, email, active) 
SELECT 'Vikram Singh', 'O-', 'Jaipur', '7766554433', 'vikram.s@gmail.com', 0
WHERE NOT EXISTS (SELECT 1 FROM donors WHERE email = 'vikram.s@gmail.com');

INSERT INTO donors (name, blood_group, city, phone, email, active) 
SELECT 'Ananya Sen', 'A+', 'Kolkata', '9988776655', 'ananya@gmail.com', 1
WHERE NOT EXISTS (SELECT 1 FROM donors WHERE email = 'ananya@gmail.com');

INSERT INTO donors (name, blood_group, city, phone, email, active) 
SELECT 'Rohan Joshi', 'O+', 'Mumbai', '9000012345', 'rohan.j@gmail.com', 1
WHERE NOT EXISTS (SELECT 1 FROM donors WHERE email = 'rohan.j@gmail.com');

-- Insert seed requests (if empty)
INSERT INTO requests (patient_name, blood_group, hospital, city, phone, urgency, status)
SELECT 'Rajesh Gupta', 'O-', 'Fortis Hospital', 'Delhi', '9876543210', 'critical', 'pending'
WHERE NOT EXISTS (SELECT 1 FROM requests WHERE patient_name = 'Rajesh Gupta');

INSERT INTO requests (patient_name, blood_group, hospital, city, phone, urgency, status)
SELECT 'Meera Deshmukh', 'AB+', 'Lilavati Hospital', 'Mumbai', '9123456789', 'medium', 'fulfilled'
WHERE NOT EXISTS (SELECT 1 FROM requests WHERE patient_name = 'Meera Deshmukh');

INSERT INTO requests (patient_name, blood_group, hospital, city, phone, urgency, status)
SELECT 'Suresh Kumar', 'B+', 'Apollo Clinic', 'Bangalore', '8877665544', 'low', 'pending'
WHERE NOT EXISTS (SELECT 1 FROM requests WHERE patient_name = 'Suresh Kumar');
