// content.js
// This script runs in the context of the critic.de webpage

// Store the original page content
let originalContent = null;

// Listen for the events from popup.js
document.addEventListener('createMovieSummary', function() {
  createAndDisplaySummary();
});

document.addEventListener('restoreOriginalView', function() {
  restoreOriginalPage();
});

// Function to extract movie data from the current page
function extractMovieData() {
  const movieContainers = document.querySelectorAll('.itemContainer');
  const movies = [];
  
  movieContainers.forEach(container => {
    const movieId = container.getAttribute('data-movie_id');
    const imageElement = container.querySelector('figure img');
    const titleElement = container.querySelector('h2 a');
    const metadataElements = container.querySelectorAll('dl.oneline dd');
    
    // Check if we found all required elements
    if (imageElement && titleElement && metadataElements.length >= 3) {
      const movie = {
        id: movieId,
        title: titleElement.textContent.trim(),
        link: titleElement.getAttribute('href'),
        imageUrl: imageElement.getAttribute('src'),
        production: metadataElements[0].textContent.trim(),
        director: metadataElements[1].textContent.trim(),
        cast: metadataElements[2].textContent.trim(),
        cinemas: []
      };
      
      // Extract cinema information
      const cinemaArticles = container.querySelectorAll('article.cinema');
      cinemaArticles.forEach(cinemaArticle => {
        const cinemaNameElement = cinemaArticle.querySelector('address a');
        if (!cinemaNameElement) return;
        
        const cinemaAddressText = cinemaArticle.querySelector('address').textContent.trim();
        const address = cinemaAddressText.replace(cinemaNameElement.textContent.trim(), '').trim();
        
        const showtimes = {};
        const showDays = cinemaArticle.querySelectorAll('table.vorstellung thead th');
        const showTimes = cinemaArticle.querySelectorAll('table.vorstellung tbody td');
        
        for (let i = 0; i < showDays.length; i++) {
          const day = showDays[i].textContent.trim();
          const times = showTimes[i] ? showTimes[i].textContent.trim() : '';
          if (times && times !== '') {
            showtimes[day] = times.split('\n');
          }
        }
        
        movie.cinemas.push({
          name: cinemaNameElement.textContent.trim(),
          address: address,
          link: cinemaNameElement.getAttribute('href'),
          showtimes: showtimes
        });
      });
      
      movies.push(movie);
    }
  });
  
  return movies;
}

// Function to create and display the summary page
function createAndDisplaySummary() {
  // Save original content if not already saved
  if (!originalContent) {
    originalContent = document.documentElement.outerHTML;
  }
  
  const movies = extractMovieData();
  
  let html = `
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Movie Summary</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f8f8;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .back-button {
          padding: 8px 15px;
          background-color: #0066cc;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .movie-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }
        .movie-card {
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          background-color: white;
          transition: transform 0.2s;
        }
        .movie-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        .movie-image {
          height: 300px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f5f5f5;
          overflow: hidden;
        }
        .movie-image img {
          max-height: 100%;
          max-width: 100%;
          object-fit: contain;
        }
        .movie-details {
          padding: 15px;
        }
        .movie-title {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #333;
        }
        .movie-info {
          font-size: 14px;
          margin-bottom: 15px;
          color: #555;
        }
        .movie-info p {
          margin: 5px 0;
        }
        .cinema-count {
          font-weight: bold;
          color: #0066cc;
          cursor: pointer;
          display: inline-block;
          padding: 3px 8px;
          background-color: #e6f0ff;
          border-radius: 4px;
        }
        .cinema-list {
          display: none;
          margin-top: 10px;
          padding: 10px;
          background-color: #f9f9f9;
          border-radius: 5px;
          border: 1px solid #eee;
        }
        .cinema-item {
          margin-bottom: 12px;
        }
        .cinema-name {
          font-weight: bold;
          margin-bottom: 5px;
          color: #333;
        }
        .today-times {
          color: #cc0000;
          font-weight: bold;
          margin-top: 3px;
        }
        hr {
          border: none;
          border-top: 1px solid #eee;
          margin: 10px 0;
        }
        .status-badge {
          position: fixed;
          top: 10px;
          right: 10px;
          background-color: #0066cc;
          color: white;
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 12px;
          z-index: 1000;
        }
      </style>
    </head>
    <body>
      <div class="status-badge">Movie Summary View</div>
      <div class="header">
        <h1>Movie Summary</h1>
        <button class="back-button" id="restoreButton">Back to Original Page</button>
      </div>
      <div class="movie-grid">
  `;
  
  movies.forEach(movie => {
    html += `
      <div class="movie-card" data-movie-id="${movie.id}">
        <div class="movie-image">
          <img src="${movie.imageUrl}" alt="${movie.title}">
        </div>
        <div class="movie-details">
          <div class="movie-title">${movie.title}</div>
          <div class="movie-info">
            <p><strong>Production:</strong> ${movie.production}</p>
            <p><strong>Director:</strong> ${movie.director}</p>
            <p><strong>Cast:</strong> ${movie.cast}</p>
            <p><span class="cinema-count" onclick="toggleCinemas('${movie.id}')">
              ${movie.cinemas.length} cinema${movie.cinemas.length !== 1 ? 's' : ''} showing
            </span></p>
          </div>
          <div id="cinemas-${movie.id}" class="cinema-list">
    `;
    
    movie.cinemas.forEach((cinema, index) => {
      const today = Object.keys(cinema.showtimes)[0];
      const todayTimes = cinema.showtimes[today] ? cinema.showtimes[today].join(', ') : 'No shows today';
      
      html += `
        <div class="cinema-item">
          <div class="cinema-name">${cinema.name}</div>
          <div>${cinema.address}</div>
          <div class="today-times">Today: ${todayTimes}</div>
        </div>
        ${index < movie.cinemas.length - 1 ? '<hr>' : ''}
      `;
    });
    
    html += `
          </div>
        </div>
      </div>
    `;
  });
  
  html += `
      </div>
      
      <script>
        function toggleCinemas(movieId) {
          const cinemaList = document.getElementById('cinemas-' + movieId);
          if (cinemaList.style.display === 'block') {
            cinemaList.style.display = 'none';
          } else {
            cinemaList.style.display = 'block';
          }
        }
        
        document.getElementById('restoreButton').addEventListener('click', function() {
          document.dispatchEvent(new CustomEvent('restoreOriginalView'));
        });
      </script>
    </body>
    </html>
  `;
  
  // Replace the current page with our summary
  document.open();
  document.write(html);
  document.close();
  
  // Re-register the event listener since we replaced the document
  document.addEventListener('restoreOriginalView', function() {
    restoreOriginalPage();
  });
}

// Function to restore the original page
function restoreOriginalPage() {
  if (originalContent) {
    document.open();
    document.write(originalContent);
    document.close();
    
    // Re-register our event listeners
    document.addEventListener('createMovieSummary', function() {
      createAndDisplaySummary();
    });
    
    document.addEventListener('restoreOriginalView', function() {
      restoreOriginalPage();
    });
  }
}