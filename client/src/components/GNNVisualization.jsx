import React from 'react';

/**
 * GNN Graph Visualization Component
 * Displays growth prediction network graph
 */
export default function GNNVisualization({ graph, prediction }) {
  if (!graph || !graph.nodes) {
    return (
      <div style={{
        background: '#fff',
        border: '1.5px solid #c5e8ef',
        borderRadius: 14,
        padding: 20,
        textAlign: 'center',
        color: '#4a7a8a'
      }}>
        No graph data available
      </div>
    );
  }

  const nodeRadius = 8;
  const canvasWidth = 600;
  const canvasHeight = 300;
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;

  // Arrange nodes in circular layout
  const arrangedNodes = graph.nodes.map((node, idx) => {
    const angle = (idx / graph.nodes.length) * 2 * Math.PI;
    const radius = 120;
    return {
      ...node,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    };
  });

  return (
    <div style={{
      background: '#fff',
      border: '1.5px solid #c5e8ef',
      borderRadius: 14,
      padding: 20,
      marginBottom: 24,
    }}>
      <h3 style={{
        fontSize: '1rem',
        fontWeight: 600,
        marginBottom: 16,
        color: '#0c2340'
      }}>
        🧠 Growth Prediction Network (GNN)
      </h3>

      <svg width={canvasWidth} height={canvasHeight} style={{
        border: '1px solid #e0f2f7',
        borderRadius: 10,
        display: 'block',
        margin: '0 auto 16px',
        background: '#f0fdff',
      }}>
        {/* Draw edges */}
        {graph.edges.map((edge, idx) => {
          const sourceNode = arrangedNodes.find(n => n.id === edge.source);
          const targetNode = arrangedNodes.find(n => n.id === edge.target);
          if (!sourceNode || !targetNode) return null;

          return (
            <line
              key={`edge-${idx}`}
              x1={sourceNode.x}
              y1={sourceNode.y}
              x2={targetNode.x}
              y2={targetNode.y}
              stroke="#0891b2"
              strokeWidth="1.5"
              opacity="0.6"
              strokeDasharray={edge.type === 'references' ? '5,5' : '0'}
            />
          );
        })}

        {/* Draw nodes */}
        {arrangedNodes.map((node) => {
          let nodeColor = '#0891b2';
          let textColor = '#fff';

          if (node.type === 'child') nodeColor = '#0e7490';
          else if (node.type === 'reference') {
            nodeColor = '#059669';
          }

          return (
            <g key={node.id}>
              <circle
                cx={node.x}
                cy={node.y}
                r={nodeRadius}
                fill={nodeColor}
                stroke="#fff"
                strokeWidth="2"
              />
              <text
                x={node.x}
                y={node.y + 18}
                textAnchor="middle"
                fontSize="10"
                fontWeight="600"
                fill="#0c2340"
              >
                {node.id.split('_')[0]}
              </text>
            </g>
          );
        })}
      </svg>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
        fontSize: '0.85rem'
      }}>
        <div>
          <strong>Nodes:</strong> {graph.nodeCount || 0}
        </div>
        <div>
          <strong>Edges:</strong> {graph.edgeCount || 0}
        </div>
      </div>
    </div>
  );
}
