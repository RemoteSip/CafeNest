# WorkCafe API Documentation

This document provides comprehensive information about the WorkCafe API endpoints, request/response formats, and authentication.

## Base URL

- Development: `http://localhost:5000/api`
- Production: `https://api.workcafe.com/api`

## Authentication

The API uses JWT (JSON Web Token) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_token>
```

### Authentication Endpoints

#### Register User

```
POST /users/register
```

Request body:
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword",
  "first_name": "John",
  "last_name": "Doe",
  "profile_image": "https://example.com/profile.jpg",
  "bio": "Remote worker and coffee enthusiast"
}
```

Response:
```json
{
  "user": {
    "user_id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "profile_image": "https://example.com/profile.jpg"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Login User

```
POST /users/login
```

Request body:
```json
{
  "email": "john@example.com",
  "password": "securepassword"
}
```

Response:
```json
{
  "user": {
    "user_id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "profile_image": "https://example.com/profile.jpg"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## User Endpoints

#### Get Current User

```
GET /users/me
```

Response:
```json
{
  "user_id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "profile_image": "https://example.com/profile.jpg",
  "bio": "Remote worker and coffee enthusiast",
  "is_verified": true,
  "created_at": "2025-01-15T14:30:00.000Z",
  "active_check_in": {
    "check_in_id": 42,
    "cafe_id": 15,
    "cafe_name": "Urban Coffee House",
    "check_in_time": "2025-03-07T09:30:00.000Z",
    "occupancy_report": 65,
    "cafe_image": "https://example.com/cafe15.jpg"
  }
}
```

#### Update User Profile

```
PUT /users/me
```

Request body:
```json
{
  "username": "johndoe_updated",
  "email": "john_new@example.com",
  "first_name": "Johnny",
  "last_name": "Doe",
  "profile_image": "https://example.com/new_profile.jpg",
  "bio": "Updated bio information"
}
```

Response:
```json
{
  "user_id": 1,
  "username": "johndoe_updated",
  "email": "john_new@example.com",
  "first_name": "Johnny",
  "last_name": "Doe",
  "profile_image": "https://example.com/new_profile.jpg",
  "bio": "Updated bio information"
}
```

#### Change Password

```
PUT /users/me/password
```

Request body:
```json
{
  "current_password": "securepassword",
  "new_password": "newSecurePassword"
}
```

Response:
```json
{
  "message": "Password updated successfully"
}
```

#### Get User's Favorite Cafes

```
GET /users/me/favorites?page=1&limit=10
```

Response:
```json
[
  {
    "cafe_id": 15,
    "name": "Urban Coffee House",
    "address": "123 Main St",
    "city": "San Francisco",
    "rating": 4.8,
    "review_count": 42,
    "occupancy_percentage": 65,
    "images": [
      {
        "image_id": 101,
        "image_url": "https://example.com/cafe15.jpg",
        "is_primary": true
      }
    ],
    "favorited_at": "2025-02-15T14:30:00.000Z"
  }
]
```

#### Add Cafe to Favorites

```
POST /users/me/favorites/:cafeId
```

Response:
```json
{
  "message": "Cafe added to favorites"
}
```

#### Remove Cafe from Favorites

```
DELETE /users/me/favorites/:cafeId
```

Response:
```json
{
  "message": "Cafe removed from favorites"
}
```

#### Get User's Check-in History

```
GET /users/me/check-ins?page=1&limit=10
```

Response:
```json
[
  {
    "check_in_id": 42,
    "cafe_id": 15,
    "cafe_name": "Urban Coffee House",
    "check_in_time": "2025-03-07T09:30:00.000Z",
    "check_out_time": "2025-03-07T13:45:00.000Z",
    "status": "completed",
    "occupancy_report": 65,
    "cafe_image": "https://example.com/cafe15.jpg"
  }
]
```

#### Check Out from Current Cafe

```
POST /users/me/check-out
```

Response:
```json
{
  "check_in_id": 42,
  "cafe_id": 15,
  "cafe_name": "Urban Coffee House",
  "check_in_time": "2025-03-07T09:30:00.000Z",
  "check_out_time": "2025-03-07T13:45:00.000Z",
  "status": "completed",
  "occupancy_report": 65
}
```

#### Get User's Reviews

```
GET /users/me/reviews?page=1&limit=10
```

Response:
```json
[
  {
    "review_id": 108,
    "cafe_id": 15,
    "cafe_name": "Urban Coffee House",
    "rating": 5,
    "comment": "Great place with fast WiFi and plenty of outlets!",
    "created_at": "2025-02-10T11:30:00.000Z",
    "wifi_rating": 5,
    "power_rating": 5,
    "comfort_rating": 4,
    "noise_rating": 3,
    "coffee_rating": 5,
    "food_rating": 4,
    "cafe_image": "https://example.com/cafe15.jpg"
  }
]
```

## Cafe Endpoints

#### Get All Cafes

```
GET /cafes?page=1&limit=10
```

Response:
```json
[
  {
    "cafe_id": 15,
    "name": "Urban Coffee House",
    "address": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "country": "United States",
    "latitude": 37.7749,
    "longitude": -122.4194,
    "description": "Hip coffee shop with great WiFi",
    "rating": 4.8,
    "review_count": 42,
    "occupancy_percentage": 65,
    "images": [
      {
        "image_id": 101,
        "image_url": "https://example.com/cafe15.jpg",
        "is_primary": true
      }
    ],
    "amenities": ["Fast Wi-Fi", "Power Outlets", "Quiet Space"]
  }
]
```

#### Search Cafes

```
GET /cafes/search?query=coffee&city=San%20Francisco&minRating=4&openNow=true&page=1&limit=10
```

Parameters:
- `query`: Text search in name and description
- `city`: Filter by city
- `amenities[]`: Filter by amenities
- `categories[]`: Filter by categories
- `minRating`: Minimum rating (0-5)
- `maxNoise`: Maximum noise level (1-5)
- `minWifi`: Minimum WiFi speed
- `openNow`: Whether cafe is currently open
- `page`: Page number
- `limit`: Results per page

Response: (Same format as Get All Cafes)

#### Find Nearby Cafes

```
GET /cafes/nearby?latitude=37.7749&longitude=-122.4194&radius=5&page=1&limit=10
```

Parameters:
- `latitude`: Current latitude
- `longitude`: Current longitude
- `radius`: Search radius in kilometers (default: 5)
- `page`: Page number
- `limit`: Results per page

Response:
```json
[
  {
    "cafe_id": 15,
    "name": "Urban Coffee House",
    "address": "123 Main St",
    "city": "San Francisco",
    "rating": 4.8,
    "review_count": 42,
    "occupancy_percentage": 65,
    "distance": 0.5,
    "images": [
      {
        "image_id": 101,
        "image_url": "https://example.com/cafe15.jpg",
        "is_primary": true
      }
    ],
    "amenities": ["Fast Wi-Fi", "Power Outlets", "Quiet Space"]
  }
]
```

#### Get Cafe Details

```
GET /cafes/:cafeId
```

Response:
```json
{
  "cafe_id": 15,
  "name": "Urban Coffee House",
  "address": "123 Main St",
  "city": "San Francisco",
  "state": "CA",
  "country": "United States",
  "latitude": 37.7749,
  "longitude": -122.4194,
  "phone": "555-123-4567",
  "website": "https://urbancoffee.example.com",
  "description": "Hip coffee shop with great WiFi",
  "hours": {
    "monday": {"open": "07:00", "close": "21:00"},
    "tuesday": {"open": "07:00", "close": "21:00"},
    "wednesday": {"open": "07:00", "close": "21:00"},
    "thursday": {"open": "07:00", "close": "21:00"},
    "friday": {"open": "07:00", "close": "22:00"},
    "saturday": {"open": "08:00", "close": "22:00"},
    "sunday": {"open": "09:00", "close": "20:00"}
  },
  "wifi_speed": 100,
  "wifi_reliability": 9,
  "power_outlets": 3,
  "noise_level": 2,
  "coffee_quality": 5,
  "food_quality": 4,
  "price_level": 2,
  "occupancy_limit": 50,
  "rating": 4.8,
  "review_count": 42,
  "wifi_rating": 4.9,
  "power_rating": 4.8,
  "comfort_rating": 4.5,
  "noise_rating": 3.8,
  "coffee_rating": 4.9,
  "food_rating": 4.2,
  "occupancy_percentage": 65,
  "active_users": 32,
  "is_favorite": true,
  "images": [
    {
      "image_id": 101,
      "image_url": "https://example.com/cafe15.jpg",
      "caption": "Main seating area",
      "is_primary": true
    }
  ],
  "amenities": [
    {
      "amenity_id": 1,
      "name": "Fast Wi-Fi",
      "icon": "wifi",
      "category": "connectivity"
    }
  ],
  "categories": [
    {
      "category_id": 1,
      "name": "Quiet Work",
      "description": "Perfect for focused work and concentration"
    }
  ]
}
```

#### Get Cafe Reviews

```
GET /cafes/:cafeId/reviews?page=1&limit=10
```

Response:
```json
[
  {
    "review_id": 108,
    "cafe_id": 15,
    "user_id": 1,
    "username": "johndoe",
    "profile_image": "https://example.com/profile.jpg",
    "rating": 5,
    "comment": "Great place with fast WiFi and plenty of outlets!",
    "wifi_rating": 5,
    "power_rating": 5,
    "comfort_rating": 4,
    "noise_rating": 3,
    "coffee_rating": 5,
    "food_rating": 4,
    "created_at": "2025-02-10T11:30:00.000Z",
    "updated_at": "2025-02-10T11:30:00.000Z"
  }
]
```

#### Add Review for Cafe

```
POST /cafes/:cafeId/reviews
```

Request body:
```json
{
  "rating": 5,
  "comment": "Great place with fast WiFi and plenty of outlets!",
  "wifi_rating": 5,
  "power_rating": 5,
  "comfort_rating": 4,
  "noise_rating": 3,
  "coffee_rating": 5,
  "food_rating": 4
}
```

Response:
```json
{
  "review_id": 108,
  "cafe_id": 15,
  "user_id": 1,
  "username": "johndoe",
  "profile_image": "https://example.com/profile.jpg",
  "rating": 5,
  "comment": "Great place with fast WiFi and plenty of outlets!",
  "wifi_rating": 5,
  "power_rating": 5,
  "comfort_rating": 4,
  "noise_rating": 3,
  "coffee_rating": 5,
  "food_rating": 4,
  "created_at": "2025-03-07T14:30:00.000Z",
  "updated_at": "2025-03-07T14:30:00.000Z"
}
```

#### Get Active Check-ins for Cafe

```
GET /cafes/:cafeId/check-ins
```

Response:
```json
[
  {
    "check_in_id": 42,
    "user_id": 1,
    "username": "johndoe",
    "profile_image": "https://example.com/profile.jpg",
    "check_in_time": "2025-03-07T09:30:00.000Z",
    "occupancy_report": 65
  }
]
```

#### Check In to Cafe

```
POST /cafes/:cafeId/check-in
```

Request body:
```json
{
  "occupancy_report": 65
}
```

Response:
```json
{
  "check_in_id": 42,
  "cafe_id": 15,
  "user_id": 1,
  "username": "johndoe",
  "profile_image": "https://example.com/profile.jpg",
  "cafe_name": "Urban Coffee House",
  "check_in_time": "2025-03-07T14:30:00.000Z",
  "check_out_time": null,
  "status": "active",
  "occupancy_report": 65
}
```

#### Get Cafe Occupancy Data

```
GET /cafes/:cafeId/occupancy
```

Response:
```json
{
  "active_users": 32,
  "occupancy_limit": 50,
  "occupancy_percentage": 64,
  "historical_data": [
    {
      "day_of_week": 1,
      "hour_of_day": 9,
      "check_in_count": 15
    }
  ]
}
```

## Error Responses

All endpoints return appropriate HTTP status codes:

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required or invalid credentials
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

Error response format:

```json
{
  "message": "Error message",
  "errors": [
    {
      "param": "username",
      "msg": "Username must be at least 3 characters long"
    }
  ]
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse. Default limits are:
- 100 requests per 15 minutes per IP address

When rate limit is exceeded, the API responds with HTTP status 429 Too Many Requests.

## Best Practices

1. Always include error handling in your client code
2. Cache responses when appropriate to minimize API calls
3. Use the provided search and filter parameters to minimize data transfer
4. Log out users when their tokens expire
5. Implement pagination for listing endpoints when displaying large datasets