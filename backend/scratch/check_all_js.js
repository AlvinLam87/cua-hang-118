async function main() {
  try {
    const mainJsUrl = 'https://www.cuahang118.online/assets/index-lEbV3z7I.js';
    console.log(`Fetching main JS from: ${mainJsUrl}`);
    const res = await fetch(mainJsUrl);
    const js = await res.text();
    console.log('Main JS Length:', js.length);
    
    // Search for references to TechnicianDashboardPage or chunks in the main JS
    // In Vite, lazy imports usually look like: () => import("./TechnicianDashboardPage-xxxxx.js")
    const match = js.match(/"[^"]*TechnicianDashboardPage-[^"]*\.js"/g) || js.match(/'[^']*TechnicianDashboardPage-[^']*\.js'/g);
    console.log('Matches found for TechnicianDashboardPage chunk:', match);
    
    // Let's also search for all chunks matching dynamic import formats
    const chunkMatches = js.match(/\/assets\/[a-zA-Z0-9_-]+\.js/g) || js.match(/[a-zA-Z0-9_-]+-[a-zA-Z0-9_-]+\.js/g);
    console.log('Sample chunk references:', chunkMatches ? chunkMatches.slice(0, 10) : 'none');
    
    // Let's search inside the JS for 'ky-thuat-vien'
    const containsRoute = js.includes('ky-thuat-vien');
    console.log("Contains route '/ky-thuat-vien'?", containsRoute);

  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

main();
