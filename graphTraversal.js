// To complete the requirements of the project, we are sorting and parsing our data using graphs and BFS/DFS traversal
// each song is a node and each edge is a genre

//Depth first search...
function depthFirstSearch(graph, start) {
    const visited = new Set();
    const result = [];

    function dfs(node) {
        if (visited.has(node)) return;
        visited.add(node);
        result.push(node);

        if (graph[node]) {
            for (const neighbor of graph[node]) {
                dfs(neighbor);
            }
        }
    }

    dfs(start);
    return result;
}


// Breadth first seach
function breadthFirstSearch(graph, start) {
    const visited = new Set();
    const result = [];
    const queue = [start];

    while (queue.length > 0) {
        const node = queue.shift();

        if (!visited.has(node)) {
            visited.add(node);
            result.push(node);

            if (graph[node]) {
                queue.push(...graph[node]);
            }
        }
    }

    return result;
}

module.exports = { depthFirstSearch, breadthFirstSearch };
