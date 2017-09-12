// 这是连线的点相对于topo-node的偏移量，要算上 2px 的边框
const TopoNodeHeaderHeight = 28 + 2
const TopoNodeHeaderWidth = 240 + 4
const LineWidth = 2
const PivotWidth = 4

// 这是连线的点相对于每个节点左上角的偏移量
// const PivotOffsetY = (TopoNodeHeaderHeight - PivotWidth + LineWidth) / 2;
// const PivotOffsetXSmall = 12 + 2 + (PivotWidth - LineWidth) / 2;
// const PivotOffsetXLarge = TopoNodeHeaderWidth - 2 - PivotOffsetXSmall + PivotWidth;
// TODO: 先用魔数，回头我再来优化这个公式
const PivotOffsetY = 16;
const PivotOffsetXSmall = 14;
const PivotOffsetXLarge = 230;

export {
  PivotOffsetY,
  PivotOffsetXLarge,
  PivotOffsetXSmall,
};
