import { useRef, useCallback, useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useIsMobile } from '../hooks/use-mobile';

/**
 * ConnectionGraph - A force-directed graph visualization for connection paths
 * 
 * @param {Object} props
 * @param {Array} props.paths - Array of path objects with format { path: "A → B → C", strength: number }
 * @param {number} props.width - Optional custom width for the graph
 * @param {number} props.height - Optional custom height for the graph
 */
const ConnectionGraph = ({ paths = [], width, height }) => {
  const graphRef = useRef(null);
  const isMobile = useIsMobile();
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [hoveredNode, setHoveredNode] = useState(null);
  
  // Calculate graph dimensions based on container or provided props
  const graphWidth = width || (isMobile ? window.innerWidth - 40 : 800);
  const graphHeight = height || (isMobile ? 400 : 600);

  // Parse the paths into graph data structure
  useEffect(() => {
    if (!paths || paths.length === 0) {
      setGraphData({ nodes: [], links: [] });
      return;
    }

    // Track unique nodes to avoid duplicates
    const nodesMap = new Map();
    const links = [];

    paths.forEach((pathItem, pathIndex) => {
      // Skip if path is missing or empty
      if (!pathItem.path) return;
      
      // Split the path into individual nodes
      // Handle various separator formats: →, ->, to, and commas
      const nodeNames = pathItem.path
        .replace(/→|->|to/g, ',')
        .split(',')
        .map(name => name.trim())
        .filter(name => name.length > 0);

      // Create nodes for each name if they don't exist yet
      nodeNames.forEach(name => {
        if (!nodesMap.has(name)) {
          nodesMap.set(name, {
            id: name,
            name,
            group: 1,
            // Extract any additional info from the path description for tooltips
            description: pathItem.path.includes(name) 
              ? pathItem.path.substring(pathItem.path.indexOf(name)) 
              : ''
          });
        }
      });

      // Create links between consecutive nodes in the path
      for (let i = 0; i < nodeNames.length - 1; i++) {
        const source = nodeNames[i];
        const target = nodeNames[i + 1];
        
        // Skip if source or target is missing
        if (!source || !target) continue;
        
        links.push({
          id: `${source}-${target}-${pathIndex}`,
          source,
          target,
          strength: pathItem.strength || 50, // Default to 50 if strength is missing
          // Scale the value to be between 1-10 for width visualization
          value: (pathItem.strength / 10) || 5
        });
      }
    });

    setGraphData({
      nodes: Array.from(nodesMap.values()),
      links
    });
  }, [paths]);

  // Handle node click to center and zoom on the node
  const handleNodeClick = useCallback(node => {
    if (!graphRef.current) return;
    
    const distance = 100;
    const distRatio = 1 + distance/Math.hypot(node.x, node.y);

    if (graphRef.current.zoomToFit) {
      graphRef.current.centerAt(node.x, node.y, 1000);
      setTimeout(() => {
        graphRef.current.zoom(2.5, 1000);
      }, 700);
    }
  }, []);

  // Handle node hover to show tooltip
  const handleNodeHover = node => {
    setHoveredNode(node);
    document.body.style.cursor = node ? 'pointer' : 'default';
  };

  // Custom node painting
  const paintNode = useCallback((node, ctx, globalScale) => {
    const isHovered = hoveredNode && hoveredNode.id === node.id;
    const label = node.name;
    const fontSize = isHovered ? 16/globalScale : 14/globalScale;
    
    // Node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, isHovered ? 8/globalScale : 6/globalScale, 0, 2 * Math.PI);
    ctx.fillStyle = isHovered ? '#00e5ff' : '#5d34eb';
    ctx.fill();
    
    ctx.strokeStyle = isHovered ? '#ffffff' : '#9f7aea';
    ctx.lineWidth = isHovered ? 2/globalScale : 1.5/globalScale;
    ctx.stroke();
    
    // Node label
    ctx.font = `${fontSize}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isHovered ? '#ffffff' : '#e2e8f0';
    ctx.fillText(label, node.x, node.y + 15/globalScale);
  }, [hoveredNode]);

  // Custom link painting with neon glow effect
  const paintLink = useCallback((link, ctx, globalScale) => {
    const isHighlighted = hoveredNode && 
      (link.source.id === hoveredNode.id || link.target.id === hoveredNode.id);
    
    // Calculate opacity based on strength
    const opacity = isHighlighted ? 1 : Math.min(0.2 + (link.strength / 100), 0.8);
    
    // Calculate link width based on value and scale
    const width = isHighlighted 
      ? Math.max(3, link.value || 3)/globalScale 
      : Math.max(1.5, (link.value || 2)/1.5)/globalScale;
    
    // Set color based on strength (from cool blue to hot pink)
    let color;
    if (link.strength < 30) {
      color = isHighlighted ? '#4361ee' : 'rgba(67, 97, 238, ' + opacity + ')';
    } else if (link.strength < 60) {
      color = isHighlighted ? '#4cc9f0' : 'rgba(76, 201, 240, ' + opacity + ')';
    } else if (link.strength < 80) {
      color = isHighlighted ? '#ff8fab' : 'rgba(255, 143, 171, ' + opacity + ')';
    } else {
      color = isHighlighted ? '#ff0a54' : 'rgba(255, 10, 84, ' + opacity + ')';
    }
    
    // Draw link with neon effect
    ctx.beginPath();
    ctx.moveTo(link.source.x, link.source.y);
    ctx.lineTo(link.target.x, link.target.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
    
    // Add glow effect for highlighted links
    if (isHighlighted) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    
    // Draw strength label if highlighted
    if (isHighlighted) {
      const midX = (link.source.x + link.target.x) / 2;
      const midY = (link.source.y + link.target.y) / 2;
      
      ctx.font = `${12/globalScale}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      
      // Draw background for text
      const strengthText = `${Math.round(link.strength)}%`;
      const textWidth = ctx.measureText(strengthText).width + 10/globalScale;
      const textHeight = 20/globalScale;
      
      ctx.fillStyle = 'rgba(17, 24, 39, 0.8)';
      ctx.fillRect(
        midX - textWidth/2, 
        midY - textHeight/2, 
        textWidth, 
        textHeight
      );
      
      // Draw text
      ctx.fillStyle = '#ffffff';
      ctx.fillText(strengthText, midX, midY);
    }
  }, [hoveredNode]);

  return (
    <div className="relative w-full">
      <div className="rounded-lg overflow-hidden bg-gray-900/60 border border-gray-800 backdrop-blur-md shadow-xl">
        {paths.length > 0 ? (
          <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            width={graphWidth}
            height={graphHeight}
            backgroundColor="rgba(0,0,0,0)"
            linkDirectionalParticles={2}
            linkDirectionalParticleWidth={link => link.strength / 20}
            linkDirectionalParticleSpeed={0.005}
            nodeCanvasObject={paintNode}
            linkCanvasObject={paintLink}
            onNodeClick={handleNodeClick}
            onNodeHover={handleNodeHover}
            cooldownTicks={100}
            nodeRelSize={6}
            nodeLabel={node => node.name}
            d3AlphaDecay={0.01}
            d3VelocityDecay={0.2}
          />
        ) : (
          <div 
            className="flex items-center justify-center"
            style={{ width: graphWidth, height: graphHeight }}
          >
            <p className="text-gray-400">No connection paths available to visualize</p>
          </div>
        )}
      </div>
      
      {/* Tooltip */}
      {hoveredNode && (
        <div className="absolute top-2 left-2 bg-gray-900/90 backdrop-blur-md p-3 rounded-md border border-indigo-600 max-w-xs z-10 shadow-glow">
          <h3 className="font-medium text-white">{hoveredNode.name}</h3>
          <p className="text-gray-300 text-sm mt-1">{hoveredNode.description || "Connection node"}</p>
        </div>
      )}
    </div>
  );
};

export default ConnectionGraph;