import axios from 'axios';

// Cache to prevent frequent API calls (optional but good)
let cachedEducationNews = null;
let lastFetchTime = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export const getEducationNews = async (req, res) => {
  try {
    const now = Date.now();
    if (cachedEducationNews && (now - lastFetchTime < CACHE_DURATION)) {
      return res.json({ success: true, items: cachedEducationNews });
    }

    const apiKey = "pub_bee8c3de0f2b494bae0826bd8563e370";
    
    if (!apiKey) {
      // Return mock data if NO API key provided
      const mockNews = [
        {
          title: "Quantum Computing: The Next Frontier in Engineering Innovation",
          description: "Leading tech firms are investing billions in quantum labs, creating 5,000+ specialized engineering roles.",
          url: "https://www.sciencedaily.com/news/computers_math/quantum_computing/",
          source: { name: "Science Daily" },
          publishedAt: new Date().toISOString(),
          image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=400"
        },
        {
          title: "Semiconductor Market 2026: Why India is becoming a global hub",
          description: "Major shifts in the global supply chain have positioned the Indian engineering sector for record growth.",
          url: "https://www.thehindu.com/sci-tech/technology/",
          source: { name: "Market Watch" },
          publishedAt: new Date().toISOString(),
          image: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=400"
        },
        {
          title: "AI-Powered Civil Engineering: Predicting Infrastructure Longevity",
          description: "New researchers at Top IITs have developed models that can predict structural failure with 99% accuracy.",
          url: "https://www.ndtv.com/education",
          source: { name: "Tech Pulse" },
          publishedAt: new Date().toISOString(),
          image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=400"
        }
      ];
      return res.json({ success: true, items: mockNews, isMock: true });
    }

    const categories = "top,world,politics";
    const url = `https://newsdata.io/api/1/news?apikey=${apiKey}&category=${categories}&language=en,hi`;

    const response = await axios.get(url);
    const articles = response.data.results.map(article => ({
        title: article.title,
        description: article.description,
        url: article.link,
        source: { name: article.source_id },
        publishedAt: article.pubDate,
        image: article.image_url
    }));

    cachedEducationNews = articles;
    lastFetchTime = now;

    res.json({ success: true, items: articles });
  } catch (error) {
    console.error("News API Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch news" });
  }
};
