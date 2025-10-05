// -------------- Patch Bank Loading --------------
function loadPatchBanks() {
  const storeContainer = document.querySelector('.patch-banks-grid');

  patchBanks.forEach(bank => {
    const storeItem = document.createElement('div');
    storeItem.classList.add('store-item');

    // Construct the data-search content (for fuzzy matching)
    // We'll combine name + description for the search text
    const searchData = `${bank.name} ${bank.description}`.toLowerCase();
    storeItem.setAttribute('data-search', searchData);

    // Title
    const title = document.createElement('h3');
    title.textContent = bank.name;

    // Description
    const desc = document.createElement('p');
    desc.textContent = bank.description;

    // YouTube embed(s) if present
    if (Array.isArray(bank.audioDemo) && bank.audioDemo.length > 0) {
      bank.audioDemo.forEach(videoId => {
        if (!videoId) return; // skip empty
        const embedContainer = document.createElement('div');
        embedContainer.classList.add('youtube-embed-container');

        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube.com/embed/${videoId}`;
        iframe.allowFullscreen = true;
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";

        embedContainer.appendChild(iframe);
        storeItem.appendChild(embedContainer);
      });
    }

    // Download Button
    const downloadBtn = document.createElement('a');
    downloadBtn.classList.add('download-btn');
    downloadBtn.href = bank.downloadLink;
    downloadBtn.textContent = 'Download';

    // Append elements
    storeItem.appendChild(title);
    storeItem.appendChild(desc);
    storeItem.appendChild(downloadBtn);

    storeContainer.appendChild(storeItem);
  });
}

// -------------- YouTube Music & Remixes --------------
const lambdaUrl = 'https://hh2nvebg2jac4yabkprsserxcq0lvhid.lambda-url.us-east-1.on.aws/';

function fetchYouTubePlaylist() {
  fetch(lambdaUrl)
    .then(response => response.json())
    .then(data => {
      const musicContainer = document.getElementById('music-container');
      data.items.forEach(item => {
        const videoId = item.videoId;  // Adjusted based on new API response
        const title = item.title || '';
        const description = item.description || '';

        // Create store item
        const videoTile = document.createElement('div');
        videoTile.classList.add('store-item');

        // data-search attribute: combine title + description
        const searchData = `${title} ${description}`.toLowerCase();
        videoTile.setAttribute('data-search', searchData);

        // Iframe
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube.com/embed/${videoId}`;
        iframe.width = "100%";
        iframe.height = "220px";
        iframe.frameBorder = "0";
        iframe.allowFullscreen = true;
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";

        // Title / description
        const videoTitle = document.createElement('h3');
        videoTitle.textContent = title;

        const videoDesc = document.createElement('p');
        videoDesc.textContent = description;

        // Append
        videoTile.appendChild(videoTitle);
        videoTile.appendChild(iframe);
        videoTile.appendChild(videoDesc);

        musicContainer.appendChild(videoTile);
      });
    })
    .catch(error => console.error('Error fetching YouTube playlist:', error));
}

// -------------- Fuzzy Search (Simple Substring Match) --------------
function setupSearch() {
  const searchInput = document.getElementById('searchInput');
  
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    // Grab all items from BOTH patch banks and music section
    const allItems = document.querySelectorAll('.store-item');
    
    allItems.forEach(item => {
      const searchData = item.getAttribute('data-search') || '';
      // Show/hide based on substring match
      if (searchData.includes(query)) {
        item.style.display = 'block';
      } else {
        item.style.display = 'none';
      }
    });
  });
}

// -------------- DOMContentLoaded --------------
document.addEventListener('DOMContentLoaded', () => {
  // Load Patch Banks
  loadPatchBanks();

  // Load YouTube playlist
  fetchYouTubePlaylist();
  
  // Setup the fuzzy search
  setupSearch();
});
