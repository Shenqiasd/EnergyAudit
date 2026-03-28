export interface SankeyNode {
  id: string;
  name: string;
  category: 'source' | 'transformation' | 'end_use';
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

export interface EnergyFlowInput {
  sources: Array<{
    id: string;
    name: string;
    totalAmount: number;
  }>;
  transformations: Array<{
    id: string;
    name: string;
    inputs: Array<{ sourceId: string; amount: number }>;
    outputs: Array<{ targetId: string; amount: number }>;
    loss: number;
  }>;
  endUses: Array<{
    id: string;
    name: string;
  }>;
}

export function buildSankeyData(input: EnergyFlowInput): SankeyData {
  const nodes: SankeyNode[] = [];
  const links: SankeyLink[] = [];

  for (const source of input.sources) {
    nodes.push({
      id: source.id,
      name: source.name,
      category: 'source',
    });
  }

  for (const trans of input.transformations) {
    nodes.push({
      id: trans.id,
      name: trans.name,
      category: 'transformation',
    });

    for (const inp of trans.inputs) {
      links.push({
        source: inp.sourceId,
        target: trans.id,
        value: inp.amount,
      });
    }

    for (const out of trans.outputs) {
      links.push({
        source: trans.id,
        target: out.targetId,
        value: out.amount,
      });
    }

    if (trans.loss > 0) {
      const lossNodeId = `${trans.id}-loss`;
      nodes.push({
        id: lossNodeId,
        name: `${trans.name}损耗`,
        category: 'end_use',
      });
      links.push({
        source: trans.id,
        target: lossNodeId,
        value: trans.loss,
      });
    }
  }

  for (const endUse of input.endUses) {
    if (!nodes.find((n) => n.id === endUse.id)) {
      nodes.push({
        id: endUse.id,
        name: endUse.name,
        category: 'end_use',
      });
    }
  }

  return { nodes, links };
}

export function buildSankeyFromEnergyBalance(
  energyItems: Array<{
    fieldCode: string;
    finalValue: string | null;
    rawValue: string | null;
  }>,
): SankeyData {
  const getValue = (fieldCode: string): number => {
    const item = energyItems.find((i) => i.fieldCode === fieldCode);
    if (!item) return 0;
    const val = item.finalValue ?? item.rawValue;
    if (val === null || val === '') return 0;
    const num = Number(val);
    return isFinite(num) ? num : 0;
  };

  const coal = getValue('coal_consumption');
  const electricity = getValue('electricity_consumption');
  const naturalGas = getValue('natural_gas_consumption');
  const oil = getValue('oil_consumption');
  const heat = getValue('heat_consumption');

  const productionUse = getValue('production_energy_use');
  const auxiliaryUse = getValue('auxiliary_energy_use');
  const officeUse = getValue('office_energy_use');
  const totalLoss = getValue('transmission_loss');

  const input: EnergyFlowInput = {
    sources: [],
    transformations: [],
    endUses: [],
  };

  if (coal > 0) input.sources.push({ id: 'coal', name: '煤炭', totalAmount: coal });
  if (electricity > 0) input.sources.push({ id: 'electricity', name: '电力', totalAmount: electricity });
  if (naturalGas > 0) input.sources.push({ id: 'natural-gas', name: '天然气', totalAmount: naturalGas });
  if (oil > 0) input.sources.push({ id: 'oil', name: '石油', totalAmount: oil });
  if (heat > 0) input.sources.push({ id: 'heat', name: '热力', totalAmount: heat });

  const totalInput = coal + electricity + naturalGas + oil + heat;

  if (totalInput > 0) {
    const outputs: Array<{ targetId: string; amount: number }> = [];
    if (productionUse > 0) outputs.push({ targetId: 'production', amount: productionUse });
    if (auxiliaryUse > 0) outputs.push({ targetId: 'auxiliary', amount: auxiliaryUse });
    if (officeUse > 0) outputs.push({ targetId: 'office', amount: officeUse });

    const accounted = productionUse + auxiliaryUse + officeUse + totalLoss;
    const unaccounted = totalInput - accounted;
    if (unaccounted > 0) outputs.push({ targetId: 'other', amount: unaccounted });

    input.transformations.push({
      id: 'energy-distribution',
      name: '能源分配',
      inputs: input.sources.map((s) => ({ sourceId: s.id, amount: s.totalAmount })),
      outputs,
      loss: totalLoss > 0 ? totalLoss : 0,
    });

    if (productionUse > 0) input.endUses.push({ id: 'production', name: '生产用能' });
    if (auxiliaryUse > 0) input.endUses.push({ id: 'auxiliary', name: '辅助用能' });
    if (officeUse > 0) input.endUses.push({ id: 'office', name: '办公用能' });
    if (unaccounted > 0) input.endUses.push({ id: 'other', name: '其他' });
  }

  return buildSankeyData(input);
}
