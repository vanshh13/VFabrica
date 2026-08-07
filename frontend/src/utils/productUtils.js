/**
 * Resolves the unit display name for any product based on unit_name, unit, unit_id or category.
 */
export function getProductUnit(product) {
    if (!product) return 'unit';
    
    // Direct unit field or unit_name
    const raw = product.unit_name || product.unit || product.unit_symbol;
    if (raw && typeof raw === 'string' && raw.trim().length > 0) {
        return raw.trim();
    }

    // Infer unit based on category name
    const category = String(product.category_name || product.category?.name || product.category || '').toLowerCase();
    
    if (category.includes('apparel') || category.includes('garment') || category.includes('cloth') || category.includes('shirt') || category.includes('dress') || category.includes('jacket')) {
        return 'Piece';
    }
    if (category.includes('fiber') || category.includes('yarn') || category.includes('cotton raw')) {
        return 'Kg';
    }
    if (category.includes('machine') || category.includes('equipment') || category.includes('machinery') || category.includes('tool')) {
        return 'Unit';
    }
    if (category.includes('fabric') || category.includes('linen') || category.includes('silk') || category.includes('textile')) {
        return 'Meter';
    }

    return 'Unit';
}

/**
 * Format quantity and unit properly.
 * Example: formatUnitQuantity(5, 'Piece') -> "5 pieces"
 * Example: formatUnitQuantity(1, 'Set of 5') -> "1 set (of 5)"
 * Example: formatUnitQuantity(10, 'Kg') -> "10 kg"
 */
export function formatUnitQuantity(quantity, unitName) {
    const qty = Number(quantity || 0);
    const u = String(unitName || 'unit').trim();
    const lower = u.toLowerCase();

    if (lower === 'meter' || lower === 'meters' || lower === 'm') {
        return `${qty} meter${qty === 1 ? '' : 's'}`;
    }
    if (lower === 'piece' || lower === 'pieces' || lower === 'pc' || lower === 'pcs') {
        return `${qty} piece${qty === 1 ? '' : 's'}`;
    }
    if (lower === 'set of 5' || lower === '5-pack' || lower.includes('set of 5')) {
        return `${qty} set${qty === 1 ? '' : 's'} of 5`;
    }
    if (lower.includes('set of')) {
        return `${qty} ${u}`;
    }
    if (lower === 'set' || lower === 'sets') {
        return `${qty} set${qty === 1 ? '' : 's'}`;
    }
    if (lower === 'kg' || lower === 'kilogram' || lower === 'kilograms') {
        return `${qty} kg`;
    }
    if (lower === 'metric ton' || lower === 'mt' || lower === 'ton' || lower === 'tons') {
        return `${qty} MT`;
    }
    if (lower === 'bale' || lower === 'bales') {
        return `${qty} bale${qty === 1 ? '' : 's'}`;
    }
    if (lower === 'roll' || lower === 'rolls') {
        return `${qty} roll${qty === 1 ? '' : 's'}`;
    }
    if (lower === 'machine' || lower === 'machines' || lower === 'unit' || lower === 'units') {
        return `${qty} unit${qty === 1 ? '' : 's'}`;
    }
    if (lower === 'yard' || lower === 'yards' || lower === 'yd') {
        return `${qty} yard${qty === 1 ? '' : 's'}`;
    }
    if (lower === 'dozen' || lower === 'dozens' || lower === 'dz') {
        return `${qty} dozen${qty === 1 ? '' : 's'}`;
    }

    return `${qty} ${u}`;
}
