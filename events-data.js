// First create a data fetcher
async function fetchKSUEvents() {
    // Using a CORS proxy to avoid cross-origin issues
    const CORS_PROXY = "https://cors-anywhere.herokuapp.com/";
    const KSU_CALENDAR = "https://ksuowls.com/calendar";

    try {
        const response = await fetch(CORS_PROXY + KSU_CALENDAR);
        const data = await response.text();
        
        // Create a DOM parser to work with the HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(data, 'text/html');
        
        // Find all event elements
        const events = [];
        const eventElements = doc.querySelectorAll('.event-item'); // Adjust selector based on actual HTML structure

        eventElements.forEach(element => {
            const event = {
                sport: element.querySelector('.sport')?.textContent,
                homeTeam: "KSU Owls",
                awayTeam: element.querySelector('.opponent')?.textContent,
                date: element.querySelector('.date')?.textContent,
                time: element.querySelector('.time')?.textContent,
                location: element.querySelector('.location')?.textContent,
                // Calculate points based on sport type
                basePoints: calculatePoints(element.querySelector('.sport')?.textContent)
            };
            events.push(event);
        });

        return events;
    } catch (error) {
        console.error('Error fetching KSU events:', error);
        // Return fallback data if fetch fails
        return getFallbackEvents();
    }
}

// Points calculation based on sport type
function calculatePoints(sport) {
    const pointsMap = {
        'Basketball': 250,
        'Baseball': 200,
        'Football': 300,
        'Volleyball': 150,
        'Soccer': 200
    };
    return pointsMap[sport] || 100; // Default 100 points if sport not found
}

// Fallback data in case the fetch fails
function getFallbackEvents() {
    return [
        {
            sport: "Baseball",
            homeTeam: "KSU Owls",
            awayTeam: "Jacksonville State",
            date: "March 22, 2024",
            time: "6:00 PM",
            location: "Stillwell Stadium",
            basePoints: 200
        },
        // Add more fallback events...
    ];
} 