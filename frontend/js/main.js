// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize the application
  initApp();
});

// Main initialization function
function initApp() {
  // Initialize UI components
  initUIComponents();
  
  // Load initial data
  loadInitialCafes();
  
  // Check authentication status
  checkAuthStatus();
  
  // Initialize event listeners
  setupEventListeners();
}

// Initialize UI components
function initUIComponents() {
  // Initialize mobile menu
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  
  if (hamburgerBtn && mobileMenu) {
    hamburgerBtn.addEventListener('click', () => {
      hamburgerBtn.classList.toggle('active');
      mobileMenu.classList.toggle('active');
    });
  }

  // Initialize filters
  const filterToggle = document.getElementById('filter-toggle');
  const filters = document.getElementById('filters');
  
  if (filterToggle && filters) {
    filterToggle.addEventListener('click', (event) => {
      event.stopPropagation();
      filters.classList.toggle('active');
    });
    
    // Close filters when clicking outside
    document.addEventListener('click', (event) => {
      if (!event.target.closest('.filter-container') && filters.classList.contains('active')) {
        filters.classList.remove('active');
      }
    });
  }
}

// Setup event listeners
function setupEventListeners() {
  // Near me button
  const nearMeBtn = document.getElementById('near-me-btn');
  if (nearMeBtn) {
    nearMeBtn.addEventListener('click', getUserLocation);
  }

  // Search button
  const searchBtn = document.getElementById('search-btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', handleSearch);
  }

  // Floating action button
  const fab = document.getElementById('fab');
  if (fab) {
    fab.addEventListener('click', handleFabClick);
  }

  // Category buttons
  const categoryButtons = document.querySelectorAll('.category');
  if (categoryButtons.length > 0) {
    categoryButtons.forEach(button => {
      button.addEventListener('click', handleCategoryClick);
    });
  }

  // Load more button
  const loadMoreBtn = document.getElementById('load-more');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', handleLoadMore);
  }

  // Apply filters button
  const applyFiltersBtn = document.getElementById('apply-filters-btn');
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', handleApplyFilters);
  }

  // Login/Signup buttons
  const loginBtn = document.getElementById('login-btn');
  const signupBtn = document.getElementById('signup-btn');
  const mobileLoginBtn = document.getElementById('mobile-login-btn');
  const mobileSignupBtn = document.getElementById('mobile-signup-btn');
  
  if (loginBtn) loginBtn.addEventListener('click', () => window.location.href = '/login');
  if (signupBtn) signupBtn.addEventListener('click', () => window.location.href = '/signup');
  if (mobileLoginBtn) mobileLoginBtn.addEventListener('click', () => window.location.href = '/login');
  if (mobileSignupBtn) mobileSignupBtn.addEventListener('click', () => window.location.href = '/signup');

  // Add event delegation for cafe cards (for cards added dynamically)
  const cafeCardsContainer = document.getElementById('cafe-cards');
  if (cafeCardsContainer) {
    cafeCardsContainer.addEventListener('click', (event) => {
      const viewDetailsBtn = event.target.closest('.view-details');
      if (viewDetailsBtn) {
        const cafeId = viewDetailsBtn.getAttribute('data-cafe-id');
        if (cafeId) {
          window.location.href = `/cafe/${cafeId}`;
        }
      }
    });
  }
}

// Load initial cafes
async function loadInitialCafes() {
  try {
    const cafes = await window.WorkCafeAPI.cafes.getAllCafes(1, 10);
    
    if (cafes.error) {
      showError('Failed to load cafes: ' + cafes.message);
      return;
    }
    
    renderCafes(cafes);
  } catch (error) {
    console.error('Error loading cafes:', error);
    showError('Failed to load cafes. Please try again later.');
  }
}

// Render cafe cards
function renderCafes(cafes) {
  const cafeCardsContainer = document.getElementById('cafe-cards');
  const template = document.getElementById('cafe-card-template');
  
  if (!cafeCardsContainer || !template) {
    console.error('Missing cafe cards container or template');
    return;
  }
  
  // Remove any existing cafe cards (except the template)
  const existingCards = cafeCardsContainer.querySelectorAll('.cafe-card:not([data-id="1"])');
  existingCards.forEach(card => card.remove());
  
  // Generate cafe cards for each cafe
  cafes.forEach(cafe => {
    const cardClone = template.content.cloneNode(true);
    const cafeCard = cardClone.querySelector('.cafe-card');
    
    cafeCard.setAttribute('data-id', cafe.cafe_id);
    
    const img = cardClone.querySelector('img');
    const imageSrc = cafe.images && cafe.images.length > 0 
      ? cafe.images[0].image_url 
      : '../images/placeholder.jpg';
    img.setAttribute('data-src', imageSrc);
    img.setAttribute('alt', cafe.name);
    
    cardClone.querySelector('h3').textContent = cafe.name;
    cardClone.querySelector('.rating').textContent = `${cafe.rating} ★`;
    
    // Set distance if available
    const distanceEl = cardClone.querySelector('.distance');
    if (cafe.distance) {
      distanceEl.textContent = `${cafe.distance.toFixed(1)} miles`;
    } else {
      distanceEl.textContent = '';
    }
    
    // Set amenities
    const amenitiesEl = cardClone.querySelector('p');
    if (cafe.amenities && cafe.amenities.length > 0) {
      amenitiesEl.textContent = cafe.amenities.slice(0, 3).join(', ');
    } else {
      amenitiesEl.textContent = 'No amenities listed';
    }
    
    // Set open/closed status
    const openEl = cardClone.querySelector('.open');
    openEl.textContent = 'Open Now'; // Ideally check hours from API
    
    // Set occupancy
    const occupancyEl = cardClone.querySelector('.occupancy');
    occupancyEl.textContent = cafe.occupancy_percentage 
      ? `${cafe.occupancy_percentage}% Full` 
      : 'Occupancy unknown';
    
    // Set button cafe ID
    const viewDetailsBtn = cardClone.querySelector('.view-details');
    viewDetailsBtn.setAttribute('data-cafe-id', cafe.cafe_id);
    
    cafeCardsContainer.appendChild(cardClone);
  });
  
  // Initialize lazy loading for new images
  initLazyLoading();
}