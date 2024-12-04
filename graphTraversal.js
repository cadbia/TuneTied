// To complete the requirements of the project, we are sorting and parsing our data using graphs and BFS/DFS traversal
// each song is a node and each edge is weighted by genres in common


function weightedDepthFirstSearch(graph, start) {
    const visited = new Set();
    const result = [];
    const stack = [{ song: start, weight: 0 }]; // Use stack for DFS
  
    while (stack.length > 0) {
      // Sort stack by weight to prioritize connections with higher shared genres
      stack.sort((a, b) => b.weight - a.weight);  // Sort by weight, higher first
      const { song } = stack.shift();  // Remove the highest-weight song
  
      if (!visited.has(song)) {
        visited.add(song);
        result.push(song);
  
        if (graph[song]) {
          graph[song].forEach((neighbor) => {
            if (!visited.has(neighbor.song)) {
              stack.push({ song: neighbor.song, weight: neighbor.weight });
            }
          });
        }
      }
  
      // Stop after 10 songs for the mini playlist
      if (result.length >= 10) break;
    }
  
    return result;
  }
  
  


// Breadth first seach
function weightedBreadthFirstSearch(graph, start) {
    const visited = new Set();
    const result = [];
    const queue = [{ song: start, weight: 0 }];  // Start with the initial node and weight 0
    
    while (queue.length > 0) {
      // Dequeue the next node (we'll process it based on its weight)
      const { song, weight } = queue.shift();
      
      if (!visited.has(song)) {
        visited.add(song);
        result.push(song);  // Add the song to the result
  
        if (graph[song]) {
          // Push the neighbors into the queue, with the weight
          graph[song].forEach((neighbor) => {
            if (!visited.has(neighbor.song)) {
              // Add the neighbor's song and weight to the queue
              queue.push({ song: neighbor.song, weight: neighbor.weight });
            }
          });
        }
      }
  
      // Stop after 10 songs for the mini playlist
      if (result.length >= 10) break;
    }
  
    return result;
  }
  
  
  

module.exports = { weightedDepthFirstSearch, weightedBreadthFirstSearch };
