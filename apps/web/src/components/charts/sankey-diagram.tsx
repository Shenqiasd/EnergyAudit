"use client";

import { ChartContainer } from "./chart-container";

interface SankeyNode {
  id: string;
  name: string;
  category: "source" | "transformation" | "end_use";
}

interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

interface SankeyDiagramProps {
  title: string;
  nodes: SankeyNode[];
  links: SankeyLink[];
}

const CATEGORY_COLORS: Record<string, string> = {
  source: "#3B82F6",
  transformation: "#F59E0B",
  end_use: "#10B981",
};

interface LayoutNode extends SankeyNode {
  x: number;
  y: number;
  width: number;
  height: number;
  totalValue: number;
}

export function SankeyDiagram({ title, nodes, links }: SankeyDiagramProps) {
  if (nodes.length === 0 || links.length === 0) {
    return (
      <ChartContainer title={title}>
        <div className="flex h-48 items-center justify-center text-sm text-[var(--color-text-secondary)]">
          暂无能源流向数据
        </div>
      </ChartContainer>
    );
  }

  const svgWidth = 700;
  const svgHeight = 350;
  const nodeWidth = 20;
  const padding = 40;

  // Group nodes by category
  const sourceNodes = nodes.filter((n) => n.category === "source");
  const transNodes = nodes.filter((n) => n.category === "transformation");
  const endNodes = nodes.filter((n) => n.category === "end_use");

  // Calculate node values
  const nodeValues = new Map<string, number>();
  for (const node of nodes) {
    const outgoing = links.filter((l) => l.source === node.id).reduce((s, l) => s + l.value, 0);
    const incoming = links.filter((l) => l.target === node.id).reduce((s, l) => s + l.value, 0);
    nodeValues.set(node.id, Math.max(outgoing, incoming, 1));
  }

  // Layout columns
  const columns = [sourceNodes, transNodes, endNodes];
  const columnX = [padding, svgWidth / 2 - nodeWidth / 2, svgWidth - nodeWidth - padding];

  const layoutNodes: LayoutNode[] = [];

  for (let col = 0; col < columns.length; col++) {
    const colNodes = columns[col];
    const totalValue = colNodes.reduce((s, n) => s + (nodeValues.get(n.id) ?? 1), 0);
    const availableHeight = svgHeight - padding * 2;
    const gap = colNodes.length > 1 ? 10 : 0;
    const totalGap = gap * (colNodes.length - 1);
    const scale = (availableHeight - totalGap) / Math.max(totalValue, 1);

    let currentY = padding;
    for (const node of colNodes) {
      const value = nodeValues.get(node.id) ?? 1;
      const height = Math.max(value * scale, 8);
      layoutNodes.push({
        ...node,
        x: columnX[col],
        y: currentY,
        width: nodeWidth,
        height,
        totalValue: value,
      });
      currentY += height + gap;
    }
  }

  const nodeMap = new Map(layoutNodes.map((n) => [n.id, n]));

  // Track Y offsets for link positioning
  const sourceOutOffset = new Map<string, number>();
  const targetInOffset = new Map<string, number>();

  const linkPaths = links.map((link) => {
    const sourceNode = nodeMap.get(link.source);
    const targetNode = nodeMap.get(link.target);
    if (!sourceNode || !targetNode) return null;

    const sourceTotal = nodeValues.get(link.source) ?? 1;
    const targetTotal = nodeValues.get(link.target) ?? 1;

    const linkSourceHeight = (link.value / sourceTotal) * sourceNode.height;
    const linkTargetHeight = (link.value / targetTotal) * targetNode.height;

    const sOffset = sourceOutOffset.get(link.source) ?? 0;
    const tOffset = targetInOffset.get(link.target) ?? 0;

    const sy = sourceNode.y + sOffset + linkSourceHeight / 2;
    const ty = targetNode.y + tOffset + linkTargetHeight / 2;
    const sx = sourceNode.x + sourceNode.width;
    const tx = targetNode.x;

    sourceOutOffset.set(link.source, sOffset + linkSourceHeight);
    targetInOffset.set(link.target, tOffset + linkTargetHeight);

    const midX = (sx + tx) / 2;
    const thickness = Math.max(linkSourceHeight, 2);

    return {
      d: `M ${sx} ${sy} C ${midX} ${sy}, ${midX} ${ty}, ${tx} ${ty}`,
      thickness,
      color: CATEGORY_COLORS[sourceNode.category] ?? "#94A3B8",
      value: link.value,
    };
  }).filter((p): p is NonNullable<typeof p> => p !== null);

  return (
    <ChartContainer title={title}>
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full" style={{ maxHeight: 350 }}>
        {/* Links */}
        {linkPaths.map((lp, i) => (
          <path
            key={`link-${i}`}
            d={lp.d}
            fill="none"
            stroke={lp.color}
            strokeWidth={lp.thickness}
            opacity={0.4}
          />
        ))}
        {/* Nodes */}
        {layoutNodes.map((node) => (
          <g key={node.id}>
            <rect
              x={node.x}
              y={node.y}
              width={node.width}
              height={node.height}
              fill={CATEGORY_COLORS[node.category] ?? "#94A3B8"}
              rx={2}
            />
            <text
              x={node.category === "end_use" ? node.x - 4 : node.x + node.width + 4}
              y={node.y + node.height / 2}
              textAnchor={node.category === "end_use" ? "end" : "start"}
              dominantBaseline="middle"
              fontSize={11}
              fill="#374151"
            >
              {node.name} ({node.totalValue.toFixed(1)})
            </text>
          </g>
        ))}
      </svg>
    </ChartContainer>
  );
}
