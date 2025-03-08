// DOM Elements
const hamburgerBtn = document.getElementById('hamburger-btn');
const mobileMenu = document.getElementById('mobile-menu');
const filterToggle = document.getElementById('filter-toggle');
const filters = document.getElementById('filters');
const nearMeBtn = document.getElementById('near-me-btn');
const fab = document.getElementById('fab');
const cafeCards = document.querySelectorAll('.cafe-card');
const categoryButtons = document.querySelectorAll('.category');

// Mobile Navigation
if (hamburgerBtn && mobileMenu) {
  hamburgerBtn.addEventListener('click', () => {
    hamburgerBtn.classList.toggle('active');
    mobileMenu.classList.toggle('active');
  });
}

// Filters Toggle
if (filterToggle && filters) {
  filterToggle.addEventListener('click', () => {
    filters.classList.toggle('active');
  });
  
  // Close filters when clicking outside
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.filter-container') && filters.classList.contains('active')) {
      filters.classList.remove('active');
    }
  });
}

// Geolocation
if (nearMeBtn) {
  nearMeBtn.addEventListener('click', getUserLocation);
}

// Floating Action Button
if (fab) {
  fab.addEventListener('click', () => {
    // Show quick search modal or other primary action
    alert('Quick Search Feature Coming Soon!');
  });
}

// Category Filtering
if (categoryButtons.length > 0) {
  categoryButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all category buttons
      categoryButtons.forEach(btn => btn.classList.remove('active'));
      
      // Add active class to clicked button
      button.classList.add('active');
      
      // Filter cafe cards based on category (would be more sophisticated in a real app)
      const category = button.textContent.toLowerCase();
      filterCafesByCategory(category);
    });
  });
}

// Function to filter cafes by category
function filterCafesByCategory(category) {
  // This is a simple implementation - in a real app you would have more data
  // and more sophisticated filtering
  
  if (category === 'all') {
    // Show all cafe cards
    cafeCards.forEach(card => {
      card.style.display = 'block';
    });
    return;
  }
  
  // Filter based on category
  cafeCards.forEach(card => {
    // In a real app, each card would have data attributes with its categories
    // For this demo, we'll just randomly show/hide cards
    const shouldShow = Math.random() > 0.5;
    card.style.display = shouldShow ? 'block' : 'none';
  });
}

// Lazy Loading Images
document.addEventListener('DOMContentLoaded', () => {
  const lazyImages = document.querySelectorAll('img.lazy');
  const lazyLoadElements = document.querySelectorAll('.lazy-load');
  
  if ('IntersectionObserver' in window) {
    // Use Intersection Observer for efficient lazy loading
    const lazyImageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.add('loaded');
          lazyImageObserver.unobserve(img);
        }
      });
    });
    
    lazyImages.forEach(img => {
      lazyImageObserver.observe(img);
    });
    
    // Observer for other lazy-loaded elements
    const lazyElementObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('loaded');
          lazyElementObserver.unobserve(entry.target);
        }
      });
    });
    
    lazyLoadElements.forEach(element => {
      lazyElementObserver.observe(element);
    });
  } else {
    // Fallback for browsers that don't support Intersection Observer
    // Load all images immediately
    lazyImages.forEach(img => {
      img.src = img.dataset.src;
      img.classList.add('loaded');
    });
    
    lazyLoadElements.forEach(element => {
      element.classList.add('loaded');
    });
  }
});

// Check-in Feature
function checkInAtCafe(cafeId) {
  // This would make an API call to your backend in a real app
  console.log(`Checking in at cafe ${cafeId}`);
  
  // For demo purposes
  alert(`You've checked in at this café! There are 5 other remote workers here right now.`);
  
  // Request notification permission
  requestNotificationPermission();
}

// Notification Permission
async function requestNotificationPermission() {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      // Subscribe user to push notifications
      subscribeToPushNotifications();
    }
  }
}

// Subscribe to Push Notifications
function subscribeToPushNotifications() {
  // This would integrate with your push notification service
  console.log('User subscribed to push notifications');
  
  // Example notification (would normally be triggered by server)
  setTimeout(() => {
    sendCafeUpdateNotification({
      name: 'Urban Coffee House',
      occupancy: '85%'
    });
  }, 10000);
}

// Send Notification
function sendCafeUpdateNotification(cafe) {
  if (Notification.permission === 'granted') {
    new Notification('Café Update', {
      body: `${cafe.name} is getting busy! Currently at ${cafe.occupancy} capacity.`,
      icon: '/icons/logo.png'
    });
  }
}

function getUserLocation() {
  if (navigator.geolocation) {
    nearMeBtn.disabled = true;
    nearMeBtn.textContent = 'Locating...';
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        searchNearbyWorkplaces(latitude, longitude);
        
        nearMeBtn.disabled = false;
        nearMeBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
            <path fill="none" d="M0 0h24v24H0z"/>
            <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
          </svg>
          Near Me
        `;
      },
      (error) => {
        console.error("Error getting location:", error);
        nearMeBtn.disabled = false;
        nearMeBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
            <path fill="none" d="M0 0h24v24H0z"/>
            <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
          </svg>
          Near Me
        `;
        // Fall back to IP-based location or manual entry
        alert('Unable to get your location. Please enter it manually.');
      }
    );
  }
}

// Function to search workplaces near a location
function searchNearbyWorkplaces(latitude, longitude) {
  console.log(`Searching for workplaces near ${latitude}, ${longitude}`);
  // This would typically make an API call to your backend
  // For now, let's simulate loading with a timeout
  
  const loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'loading-indicator';
  loadingIndicator.textContent = 'Finding workplaces near you...';
  document.querySelector('.cafe-cards').prepend(loadingIndicator);
  
  setTimeout(() => {
    loadingIndicator.remove();
    // In a real app, you would update the cafe cards with results from the API
    alert('Found 12 workplaces within 2 miles of your location.');
  }, 2000);
}