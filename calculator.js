export function calculateMaterials(input) {
  const sectionArea = input.width * input.depth;
  const singleBarArea = Math.PI * (input.barDiameter ** 2) / 4 / 100;
  const minimumBarCount = Math.ceil(sectionArea * 0.01 / singleBarArea);
  const steelArea = singleBarArea * input.barCount;
  const ratio = steelArea / sectionArea * 100;
  const longitudinalMeters = input.height * input.barCount;
  const longitudinalPurchase = Math.ceil(longitudinalMeters * (1 + input.waste / 100) / input.stockLength);
  const tieCount = Math.floor(input.height * 100 / input.spacing) + 1;
  const tiePerimeter = 2 * ((input.width - 2 * input.cover) + (input.depth - 2 * input.cover));
  const hookLength = 20 * input.tieDiameter / 1000;
  const tieLength = (tiePerimeter / 100 + hookLength) * tieCount;
  const tiePurchase = Math.ceil(tieLength * (1 + input.waste / 100) / input.stockLength);

  return {
    sectionArea,
    minimumBarCount,
    steelArea,
    ratio,
    longitudinalMeters,
    longitudinalPurchase,
    tieCount,
    tieLength,
    tiePurchase,
    totalPieces: longitudinalPurchase + tiePurchase
  };
}